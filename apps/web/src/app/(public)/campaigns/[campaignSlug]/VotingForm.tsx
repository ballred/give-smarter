import type { Campaign } from "@give-smarter/core";
import { prisma } from "@/lib/db";
import { createVoteCheckout } from "./voting-actions";

function formatCurrency(amount: number, currency: string) {
  const hasCents = amount % 100 !== 0;
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency,
    minimumFractionDigits: hasCents ? 2 : 0,
    maximumFractionDigits: hasCents ? 2 : 0,
  }).format(amount / 100);
}

type VotingFormProps = {
  campaign: Campaign;
  showSuccess?: boolean;
  showCanceled?: boolean;
};

export async function VotingForm({
  campaign,
  showSuccess,
  showCanceled,
}: VotingFormProps) {
  if (!campaign.id) {
    return null;
  }

  const contests = await prisma.votingContest.findMany({
    where: {
      campaignId: campaign.id,
      status: "ACTIVE",
    },
    include: { candidates: true },
    orderBy: { createdAt: "desc" },
  });

  const options = contests.flatMap((contest) =>
    contest.candidates.map((candidate) => ({
      value: `${contest.id}|${candidate.id}`,
      label: `${candidate.name} (${contest.name})`,
    })),
  );

  const currency = campaign.currency ?? "USD";

  return (
    <section id="voting" className="px-6 pb-16 pt-8 sm:px-10">
      <div className="mx-auto w-full max-w-4xl space-y-6 rounded-3xl border border-[color:var(--campaign-border)] bg-[color:var(--campaign-card)] p-8 shadow-[0_20px_60px_rgba(18,15,12,0.08)]">
        <header className="space-y-2">
          <h2 className="text-3xl font-semibold text-[color:var(--campaign-ink)]">
            Vote with your gift
          </h2>
          <p className="text-sm text-[color:var(--campaign-ink-soft)]">
            Every {formatCurrency(100, currency)} equals one vote.
          </p>
        </header>

        {showSuccess ? (
          <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-900">
            Thanks for voting! Your gift has been recorded.
          </div>
        ) : null}

        {showCanceled ? (
          <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
            Checkout was canceled. You can try again any time.
          </div>
        ) : null}

        {options.length ? (
          <form action={createVoteCheckout} className="space-y-6">
            <input type="hidden" name="campaignId" value={campaign.id} />

            <label className="block text-sm font-semibold text-[color:var(--campaign-ink)]">
              Candidate
              <select
                name="selection"
                className="mt-2 w-full rounded-xl border border-[color:var(--campaign-border)] bg-white px-3 py-2 text-sm text-[color:var(--campaign-ink)]"
              >
                {options.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </label>

            <label className="block text-sm font-semibold text-[color:var(--campaign-ink)]">
              Amount ({currency})
              <input
                name="amount"
                type="number"
                min="1"
                step="0.01"
                defaultValue={10}
                className="mt-2 w-full rounded-xl border border-[color:var(--campaign-border)] bg-white px-3 py-2 text-sm text-[color:var(--campaign-ink)]"
              />
            </label>

            <div className="grid gap-4 sm:grid-cols-2">
              <label className="block text-sm font-semibold text-[color:var(--campaign-ink)]">
                First name
                <input
                  name="firstName"
                  type="text"
                  className="mt-2 w-full rounded-xl border border-[color:var(--campaign-border)] bg-white px-3 py-2 text-sm text-[color:var(--campaign-ink)]"
                />
              </label>
              <label className="block text-sm font-semibold text-[color:var(--campaign-ink)]">
                Last name
                <input
                  name="lastName"
                  type="text"
                  className="mt-2 w-full rounded-xl border border-[color:var(--campaign-border)] bg-white px-3 py-2 text-sm text-[color:var(--campaign-ink)]"
                />
              </label>
            </div>

            <label className="block text-sm font-semibold text-[color:var(--campaign-ink)]">
              Email
              <input
                name="email"
                type="email"
                required
                className="mt-2 w-full rounded-xl border border-[color:var(--campaign-border)] bg-white px-3 py-2 text-sm text-[color:var(--campaign-ink)]"
                placeholder="you@example.org"
              />
            </label>

            <button
              type="submit"
              className="inline-flex h-12 w-full items-center justify-center rounded-full bg-[color:var(--campaign-accent)] px-6 text-xs font-semibold uppercase tracking-[0.3em] text-white transition hover:bg-[color:var(--campaign-accent-strong)]"
            >
              Continue to payment
            </button>
          </form>
        ) : (
          <div className="rounded-2xl border border-dashed border-[color:var(--campaign-border)] bg-white p-6 text-sm text-[color:var(--campaign-ink-muted)]">
            Voting contests will appear here once active.
          </div>
        )}
      </div>
    </section>
  );
}
