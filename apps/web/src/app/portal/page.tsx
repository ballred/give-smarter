import { prisma } from "@/lib/db";
import { getPortalDonors } from "./portal-data";

export default async function DonorPortalHome() {
  const portal = await getPortalDonors();
  const identity = portal?.identity ?? null;
  const donors = portal?.donors ?? [];
  const donorIds = donors.map((donor) => donor.id);
  const emails = identity?.emails ?? [];

  const attendeeFilters: Array<{
    donorId?: { in: string[] };
    email?: { in: string[] };
  }> = [];
  if (donorIds.length) attendeeFilters.push({ donorId: { in: donorIds } });
  if (emails.length) attendeeFilters.push({ email: { in: emails } });

  const [ticketCount, bidCount, receiptCount] =
    attendeeFilters.length || donorIds.length
      ? await Promise.all([
          attendeeFilters.length
            ? prisma.attendee.count({ where: { OR: attendeeFilters } })
            : Promise.resolve(0),
          donorIds.length
            ? prisma.bid.count({ where: { donorId: { in: donorIds } } })
            : Promise.resolve(0),
          donorIds.length
            ? prisma.receipt.count({ where: { donorId: { in: donorIds } } })
            : Promise.resolve(0),
        ])
      : [0, 0, 0];

  const orgNames = Array.from(
    new Set(
      donors
        .map((donor) => donor.organization.publicName)
        .filter((name) => name && name.length),
    ),
  );

  return (
    <div className="space-y-6">
      <header className="space-y-2">
        <h1 className="text-3xl font-semibold text-zinc-900">Your giving</h1>
        <p className="text-sm text-zinc-600">
          Review tickets, bids, receipts, and recurring gifts in one place.
        </p>
        {identity?.name || identity?.emails?.[0] ? (
          <p className="text-xs uppercase tracking-[0.2em] text-zinc-400">
            Signed in as {identity?.name || identity?.emails?.[0]}
          </p>
        ) : null}
      </header>

      {!donors.length ? (
        <div className="rounded-2xl border border-dashed border-zinc-200 bg-white p-6 text-sm text-zinc-500">
          We could not find any donations or tickets tied to this email yet.
          Complete a gift or ticket purchase and your portal will fill in
          automatically.
        </div>
      ) : (
        <div className="grid gap-6 md:grid-cols-2">
          <div className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm">
            <h2 className="text-lg font-semibold text-zinc-900">Tickets</h2>
            <p className="mt-2 text-sm text-zinc-600">
              You have {ticketCount} ticket
              {ticketCount === 1 ? "" : "s"} on file.
            </p>
          </div>
          <div className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm">
            <h2 className="text-lg font-semibold text-zinc-900">Receipts</h2>
            <p className="mt-2 text-sm text-zinc-600">
              {receiptCount} receipt{receiptCount === 1 ? "" : "s"} ready to
              download.
            </p>
          </div>
          <div className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm">
            <h2 className="text-lg font-semibold text-zinc-900">Bids</h2>
            <p className="mt-2 text-sm text-zinc-600">
              {bidCount} bid{bidCount === 1 ? "" : "s"} placed across auctions.
            </p>
          </div>
          <div className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm">
            <h2 className="text-lg font-semibold text-zinc-900">Recurring</h2>
            <p className="mt-2 text-sm text-zinc-600">
              Recurring gifts will appear here once scheduled.
            </p>
          </div>
        </div>
      )}

      {orgNames.length ? (
        <div className="rounded-2xl border border-zinc-200 bg-white p-6 text-sm text-zinc-600 shadow-sm">
          <span className="font-semibold text-zinc-900">Organizations:</span>{" "}
          {orgNames.join(", ")}
        </div>
      ) : null}
    </div>
  );
}
