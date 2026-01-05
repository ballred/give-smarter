import type { Campaign } from "@give-smarter/core";
import { prisma } from "@/lib/db";
import { createRaffleCheckout } from "./raffle-actions";

function formatCurrency(amount: number, currency: string) {
  const hasCents = amount % 100 !== 0;
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency,
    minimumFractionDigits: hasCents ? 2 : 0,
    maximumFractionDigits: hasCents ? 2 : 0,
  }).format(amount / 100);
}

type RafflePurchaseFormProps = {
  campaign: Campaign;
  showSuccess?: boolean;
  showCanceled?: boolean;
};

export async function RafflePurchaseForm({
  campaign,
  showSuccess,
  showCanceled,
}: RafflePurchaseFormProps) {
  if (!campaign.id) {
    return null;
  }

  const raffles = await prisma.raffle.findMany({
    where: {
      campaignId: campaign.id,
      status: "ACTIVE",
    },
    orderBy: { createdAt: "desc" },
  });

  const currency = campaign.currency ?? "USD";

  return (
    <section id="raffle" className="px-6 pb-16 pt-8 sm:px-10">
      <div className="mx-auto w-full max-w-4xl space-y-6 rounded-3xl border border-[color:var(--campaign-border)] bg-[color:var(--campaign-card)] p-8 shadow-[0_20px_60px_rgba(18,15,12,0.08)]">
        <header className="space-y-2">
          <h2 className="text-3xl font-semibold text-[color:var(--campaign-ink)]">
            Raffle tickets
          </h2>
          <p className="text-sm text-[color:var(--campaign-ink-soft)]">
            Support the campaign with a chance to win.
          </p>
        </header>

        {showSuccess ? (
          <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-900">
            Tickets purchased! Good luck.
          </div>
        ) : null}

        {showCanceled ? (
          <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
            Checkout was canceled. You can try again any time.
          </div>
        ) : null}

        {raffles.length ? (
          <form action={createRaffleCheckout} className="space-y-6">
            <input type="hidden" name="campaignId" value={campaign.id} />

            <label className="block text-sm font-semibold text-[color:var(--campaign-ink)]">
              Select raffle
              <select
                name="raffleId"
                className="mt-2 w-full rounded-xl border border-[color:var(--campaign-border)] bg-white px-3 py-2 text-sm text-[color:var(--campaign-ink)]"
              >
                {raffles.map((raffle) => (
                  <option key={raffle.id} value={raffle.id}>
                    {raffle.name} · {formatCurrency(raffle.ticketPrice, currency)} per ticket
                  </option>
                ))}
              </select>
            </label>

            <label className="block text-sm font-semibold text-[color:var(--campaign-ink)]">
              Quantity
              <input
                name="quantity"
                type="number"
                min="1"
                defaultValue={1}
                className="mt-2 w-32 rounded-xl border border-[color:var(--campaign-border)] bg-white px-3 py-2 text-sm text-[color:var(--campaign-ink)]"
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
            Raffle sales are not live yet.
          </div>
        )}
      </div>
    </section>
  );
}
