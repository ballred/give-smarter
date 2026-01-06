import type { Campaign } from "@give-smarter/core";
import { prisma } from "@/lib/db";
import { createTicketCheckout } from "./ticket-actions";

function formatCurrency(amount: number, currency: string) {
  const hasCents = amount % 100 !== 0;
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency,
    minimumFractionDigits: hasCents ? 2 : 0,
    maximumFractionDigits: hasCents ? 2 : 0,
  }).format(amount / 100);
}

type TicketPurchaseFormProps = {
  campaign: Campaign;
  showSuccess?: boolean;
  showCanceled?: boolean;
};

export async function TicketPurchaseForm({
  campaign,
  showSuccess,
  showCanceled,
}: TicketPurchaseFormProps) {
  if (!campaign.id) {
    return null;
  }

  const ticketTypes = await prisma.ticketType.findMany({
    where: {
      campaignId: campaign.id,
      visibility: "PUBLIC",
    },
    orderBy: { price: "asc" },
  });
  const addOns = await prisma.ticketAddOn.findMany({
    where: {
      campaignId: campaign.id,
      isActive: true,
    },
    orderBy: { price: "asc" },
  });

  const currency = campaign.currency ?? ticketTypes[0]?.currency ?? "USD";
  const defaultTicket = ticketTypes[0];

  return (
    <section id="tickets" className="px-6 pb-16 pt-8 sm:px-10">
      <div className="mx-auto w-full max-w-4xl space-y-6 rounded-3xl border border-[color:var(--campaign-border)] bg-[color:var(--campaign-card)] p-8 shadow-[0_20px_60px_rgba(18,15,12,0.08)]">
        <header className="space-y-2">
          <h2 className="text-3xl font-semibold text-[color:var(--campaign-ink)]">
            Reserve tickets
          </h2>
          <p className="text-sm text-[color:var(--campaign-ink-soft)]">
            Choose ticket quantities and complete checkout.
          </p>
        </header>

        {showSuccess ? (
          <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-900">
            Tickets reserved! Check your email for confirmation.
          </div>
        ) : null}

        {showCanceled ? (
          <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
            Checkout was canceled. You can try again any time.
          </div>
        ) : null}

        {ticketTypes.length ? (
          <form action={createTicketCheckout} className="space-y-6">
            <input type="hidden" name="campaignId" value={campaign.id} />

            <div className="space-y-3">
              <p className="text-sm font-semibold text-[color:var(--campaign-ink)]">
                Ticket type
              </p>
              <div className="grid gap-3 sm:grid-cols-2">
                {ticketTypes.map((ticket) => (
                  <label
                    key={ticket.id}
                    className="group flex cursor-pointer flex-col rounded-2xl border border-[color:var(--campaign-border)] bg-[color:var(--campaign-surface)] px-4 py-3 text-sm transition hover:-translate-y-0.5 hover:shadow-[0_12px_30px_rgba(18,15,12,0.12)]"
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-xs uppercase tracking-[0.2em] text-[color:var(--campaign-ink-muted)]">
                        {ticket.name}
                      </span>
                      <input
                        type="radio"
                        name="ticketTypeId"
                        value={ticket.id}
                        defaultChecked={ticket.id === defaultTicket?.id}
                        className="h-4 w-4 text-[color:var(--campaign-accent)]"
                      />
                    </div>
                    <span className="mt-2 text-2xl font-semibold text-[color:var(--campaign-ink)]">
                      {formatCurrency(ticket.price, currency)}
                    </span>
                    {ticket.description ? (
                      <span className="mt-1 text-xs text-[color:var(--campaign-ink-soft)]">
                        {ticket.description}
                      </span>
                    ) : null}
                  </label>
                ))}
              </div>
            </div>

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

            <label className="block text-sm font-semibold text-[color:var(--campaign-ink)]">
              Promo code (optional)
              <input
                name="promoCode"
                type="text"
                className="mt-2 w-48 rounded-xl border border-[color:var(--campaign-border)] bg-white px-3 py-2 text-sm text-[color:var(--campaign-ink)]"
              />
            </label>

            {addOns.length ? (
              <div className="space-y-3">
                <p className="text-sm font-semibold text-[color:var(--campaign-ink)]">
                  Add-ons
                </p>
                <div className="space-y-3">
                  {addOns.map((addOn) => (
                    <label
                      key={addOn.id}
                      className="flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-[color:var(--campaign-border)] bg-[color:var(--campaign-surface)] px-4 py-3 text-sm"
                    >
                      <div>
                        <p className="font-semibold text-[color:var(--campaign-ink)]">
                          {addOn.name}
                        </p>
                        <p className="text-xs text-[color:var(--campaign-ink-soft)]">
                          {formatCurrency(addOn.price, currency)}{" "}
                          {addOn.scope === "ATTENDEE"
                            ? "per attendee"
                            : "per order"}
                        </p>
                      </div>
                      <input
                        name={`addOn_${addOn.id}`}
                        type="number"
                        min="0"
                        defaultValue={0}
                        className="w-24 rounded-xl border border-[color:var(--campaign-border)] bg-white px-3 py-2 text-sm text-[color:var(--campaign-ink)]"
                      />
                    </label>
                  ))}
                </div>
              </div>
            ) : null}

            <label className="flex items-center gap-3 text-sm font-semibold text-[color:var(--campaign-ink)]">
              <input
                name="coverFees"
                type="checkbox"
                className="h-4 w-4 rounded border-[color:var(--campaign-border)] text-[color:var(--campaign-accent)]"
              />
              Cover processing fees
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
            Ticket sales are not configured yet.
          </div>
        )}
      </div>
    </section>
  );
}
