import type { Campaign } from "@give-smarter/core";
import { prisma } from "@/lib/db";
import { createVolunteerSignup } from "./volunteer-actions";

type VolunteerSignupFormProps = {
  campaign: Campaign;
  showSuccess?: boolean;
};

export async function VolunteerSignupForm({
  campaign,
  showSuccess,
}: VolunteerSignupFormProps) {
  if (!campaign.id) {
    return null;
  }

  const shifts = await prisma.volunteerShift.findMany({
    where: { campaignId: campaign.id },
    orderBy: { startsAt: "asc" },
  });

  const returnPath = `/campaigns/${campaign.slug}/volunteer`;

  return (
    <section id="volunteer" className="px-6 pb-16 pt-8 sm:px-10">
      <div className="mx-auto w-full max-w-4xl space-y-6 rounded-3xl border border-[color:var(--campaign-border)] bg-[color:var(--campaign-card)] p-8 shadow-[0_20px_60px_rgba(18,15,12,0.08)]">
        <header className="space-y-2">
          <h2 className="text-3xl font-semibold text-[color:var(--campaign-ink)]">
            Volunteer shifts
          </h2>
          <p className="text-sm text-[color:var(--campaign-ink-soft)]">
            Choose a shift and sign up in seconds.
          </p>
        </header>

        {showSuccess ? (
          <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-900">
            Thanks for volunteering! We will be in touch with details.
          </div>
        ) : null}

        {!shifts.length ? (
          <div className="rounded-2xl border border-dashed border-[color:var(--campaign-border)] bg-white p-6 text-sm text-[color:var(--campaign-ink-muted)]">
            Volunteer shifts will appear here soon.
          </div>
        ) : (
          <form action={createVolunteerSignup} className="space-y-6">
            <input type="hidden" name="returnPath" value={returnPath} />
            <label className="block text-sm font-semibold text-[color:var(--campaign-ink)]">
              Select a shift
              <select
                name="shiftId"
                required
                className="mt-2 w-full rounded-xl border border-[color:var(--campaign-border)] bg-white px-3 py-2 text-sm text-[color:var(--campaign-ink)]"
              >
                <option value="" disabled>
                  Choose a shift
                </option>
                {shifts.map((shift) => (
                  <option key={shift.id} value={shift.id}>
                    {shift.name}
                    {shift.startsAt
                      ? ` (${shift.startsAt.toLocaleString()})`
                      : ""}
                  </option>
                ))}
              </select>
            </label>

            <div className="grid gap-4 md:grid-cols-2">
              <label className="block text-sm font-semibold text-[color:var(--campaign-ink)]">
                Full name
                <input
                  name="name"
                  type="text"
                  required
                  className="mt-2 w-full rounded-xl border border-[color:var(--campaign-border)] bg-white px-3 py-2 text-sm text-[color:var(--campaign-ink)]"
                />
              </label>
              <label className="block text-sm font-semibold text-[color:var(--campaign-ink)]">
                Email
                <input
                  name="email"
                  type="email"
                  className="mt-2 w-full rounded-xl border border-[color:var(--campaign-border)] bg-white px-3 py-2 text-sm text-[color:var(--campaign-ink)]"
                />
              </label>
            </div>

            <label className="block text-sm font-semibold text-[color:var(--campaign-ink)]">
              Phone
              <input
                name="phone"
                type="tel"
                className="mt-2 w-full rounded-xl border border-[color:var(--campaign-border)] bg-white px-3 py-2 text-sm text-[color:var(--campaign-ink)]"
              />
            </label>

            <button
              type="submit"
              className="inline-flex h-12 w-full items-center justify-center rounded-full bg-[color:var(--campaign-accent)] px-6 text-xs font-semibold uppercase tracking-[0.3em] text-white transition hover:bg-[color:var(--campaign-accent-strong)]"
            >
              Sign up to volunteer
            </button>
          </form>
        )}
      </div>
    </section>
  );
}
