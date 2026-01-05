import { createDonationCheckout } from "./donation-actions";
import { getDonationConfig } from "./donation-config";
import type { Campaign } from "@give-smarter/core";

function formatCurrency(amount: number, currency: string) {
  const hasCents = amount % 100 !== 0;
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency,
    minimumFractionDigits: hasCents ? 2 : 0,
    maximumFractionDigits: hasCents ? 2 : 0,
  }).format(amount / 100);
}

type DonationFormProps = {
  campaign: Campaign;
  showSuccess?: boolean;
  showCanceled?: boolean;
};

export function DonationForm({
  campaign,
  showSuccess,
  showCanceled,
}: DonationFormProps) {
  const config = getDonationConfig(campaign.modules);
  const currency = campaign.currency ?? "USD";
  const defaultTier = config.tiers[0];

  return (
    <section className="px-6 pb-16 pt-8 sm:px-10">
      <div className="mx-auto w-full max-w-4xl space-y-6 rounded-3xl border border-[color:var(--campaign-border)] bg-[color:var(--campaign-card)] p-8 shadow-[0_20px_60px_rgba(18,15,12,0.08)]">
        <header className="space-y-2">
          <h2 className="text-3xl font-semibold text-[color:var(--campaign-ink)]">
            Make a gift
          </h2>
          <p className="text-sm text-[color:var(--campaign-ink-soft)]">
            Your donation supports this campaign immediately.
          </p>
        </header>

        {showSuccess ? (
          <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-900">
            Thank you! Your donation was received.
          </div>
        ) : null}

        {showCanceled ? (
          <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
            Checkout was canceled. You can try again any time.
          </div>
        ) : null}

        <form action={createDonationCheckout} className="space-y-6">
          <input type="hidden" name="campaignId" value={campaign.id ?? ""} />

          <div className="space-y-3">
            <p className="text-sm font-semibold text-[color:var(--campaign-ink)]">
              Select an amount
            </p>
            <div className="grid gap-3 sm:grid-cols-3">
              {config.tiers.map((tier) => (
                <label
                  key={`${tier.amount}-${tier.label ?? "tier"}`}
                  className="group flex cursor-pointer flex-col rounded-2xl border border-[color:var(--campaign-border)] bg-[color:var(--campaign-surface)] px-4 py-3 text-sm transition hover:-translate-y-0.5 hover:shadow-[0_12px_30px_rgba(18,15,12,0.12)]"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs uppercase tracking-[0.2em] text-[color:var(--campaign-ink-muted)]">
                      {tier.label ?? "Gift"}
                    </span>
                    <input
                      type="radio"
                      name="amountChoice"
                      value={tier.amount}
                      defaultChecked={tier.amount === defaultTier.amount}
                      className="h-4 w-4 text-[color:var(--campaign-accent)]"
                    />
                  </div>
                  <span className="mt-2 text-2xl font-semibold text-[color:var(--campaign-ink)]">
                    {formatCurrency(tier.amount, currency)}
                  </span>
                  {tier.description ? (
                    <span className="mt-1 text-xs text-[color:var(--campaign-ink-soft)]">
                      {tier.description}
                    </span>
                  ) : null}
                </label>
              ))}
            </div>
          </div>

          {config.allowCustomAmount ? (
            <div className="grid gap-3 sm:grid-cols-[1fr_auto] sm:items-end">
              <label className="block text-sm font-semibold text-[color:var(--campaign-ink)]">
                Custom amount
                <input
                  name="customAmount"
                  type="number"
                  min="1"
                  step="0.01"
                  placeholder="Other amount"
                  className="mt-2 w-full rounded-xl border border-[color:var(--campaign-border)] bg-white px-3 py-2 text-sm text-[color:var(--campaign-ink)]"
                />
              </label>
              <label className="flex items-center gap-2 text-sm text-[color:var(--campaign-ink-soft)]">
                <input
                  type="radio"
                  name="amountChoice"
                  value="custom"
                  className="h-4 w-4 text-[color:var(--campaign-accent)]"
                />
                Use custom amount
              </label>
            </div>
          ) : null}

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
            Email receipt
            <input
              name="email"
              type="email"
              required
              className="mt-2 w-full rounded-xl border border-[color:var(--campaign-border)] bg-white px-3 py-2 text-sm text-[color:var(--campaign-ink)]"
              placeholder="you@example.org"
            />
          </label>

          {config.designationOptions.length ? (
            <label className="block text-sm font-semibold text-[color:var(--campaign-ink)]">
              Designation
              <select
                name="designation"
                className="mt-2 w-full rounded-xl border border-[color:var(--campaign-border)] bg-white px-3 py-2 text-sm text-[color:var(--campaign-ink)]"
              >
                <option value="">General fund</option>
                {config.designationOptions.map((option) => (
                  <option key={option} value={option}>
                    {option}
                  </option>
                ))}
              </select>
            </label>
          ) : null}

          <label className="block text-sm font-semibold text-[color:var(--campaign-ink)]">
            Dedication or note
            <input
              name="tribute"
              type="text"
              className="mt-2 w-full rounded-xl border border-[color:var(--campaign-border)] bg-white px-3 py-2 text-sm text-[color:var(--campaign-ink)]"
              placeholder="In honor of..."
            />
          </label>

          {config.coverFeesEnabled ? (
            <label className="flex items-start gap-3 text-sm text-[color:var(--campaign-ink-soft)]">
              <input
                type="checkbox"
                name="coverFees"
                defaultChecked={config.coverFeesDefault}
                className="mt-1 h-4 w-4 rounded border-[color:var(--campaign-border)] text-[color:var(--campaign-accent)]"
              />
              <span>
                Cover processing fees (estimated {Math.round(FEE_RATE * 1000) / 10}% + {formatCurrency(FEE_FIXED, currency)}).
              </span>
            </label>
          ) : null}

          <button
            type="submit"
            className="inline-flex h-12 w-full items-center justify-center rounded-full bg-[color:var(--campaign-accent)] px-6 text-xs font-semibold uppercase tracking-[0.3em] text-white transition hover:bg-[color:var(--campaign-accent-strong)]"
          >
            Continue to payment
          </button>
        </form>
      </div>
    </section>
  );
}

const FEE_RATE = 0.029;
const FEE_FIXED = 30;
