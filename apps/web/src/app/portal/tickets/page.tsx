import { prisma } from "@/lib/db";
import { formatDate } from "@/lib/receipt-template";
import { getPortalDonors } from "../portal-data";

type TicketGroup = {
  id: string;
  ticketName: string;
  campaignName?: string | null;
  orgName?: string | null;
  orderNumber?: string | null;
  orderStatus?: string | null;
  createdAt: Date;
  attendees: Array<{
    id: string;
    label: string;
    status: string;
    tableName?: string | null;
    qrCode?: string | null;
  }>;
};

export default async function DonorTicketsPage() {
  const portal = await getPortalDonors();
  const identity = portal?.identity ?? null;
  const donorIds = portal?.donors.map((donor) => donor.id) ?? [];
  const emails = identity?.emails ?? [];

  const attendeeFilters: Array<{
    donorId?: { in: string[] };
    email?: { in: string[] };
  }> = [];
  if (donorIds.length) attendeeFilters.push({ donorId: { in: donorIds } });
  if (emails.length) attendeeFilters.push({ email: { in: emails } });

  const attendees = attendeeFilters.length
    ? await prisma.attendee.findMany({
        where: { OR: attendeeFilters },
        include: {
          ticketType: { select: { name: true } },
          campaign: { select: { name: true } },
          organization: { select: { publicName: true, legalName: true } },
          order: { select: { orderNumber: true, status: true } },
          table: { select: { name: true } },
        },
        orderBy: { createdAt: "desc" },
      })
    : [];

  const grouped = new Map<string, TicketGroup>();

  for (const attendee of attendees) {
    const key = attendee.ticketOrderId ?? attendee.orderId ?? attendee.id;
    const name =
      [attendee.firstName, attendee.lastName].filter(Boolean).join(" ") ||
      attendee.email ||
      "Guest attendee";

    if (!grouped.has(key)) {
      grouped.set(key, {
        id: key,
        ticketName: attendee.ticketType?.name ?? "Ticket",
        campaignName: attendee.campaign?.name ?? null,
        orgName:
          attendee.organization?.publicName ??
          attendee.organization?.legalName ??
          null,
        orderNumber: attendee.order?.orderNumber ?? null,
        orderStatus: attendee.order?.status ?? null,
        createdAt: attendee.createdAt,
        attendees: [],
      });
    }

    grouped.get(key)?.attendees.push({
      id: attendee.id,
      label: name,
      status: attendee.status,
      tableName: attendee.table?.name ?? null,
      qrCode: attendee.qrCode ?? null,
    });
  }

  const groups = Array.from(grouped.values());

  return (
    <div className="space-y-6">
      <header className="space-y-1">
        <h1 className="text-2xl font-semibold text-stone-900">Tickets</h1>
        <p className="text-sm text-stone-600">
          Your ticket orders, guests, and event details.
        </p>
      </header>

      {!groups.length ? (
        <div className="rounded-2xl border border-dashed border-amber-200/60 bg-white p-6 text-sm text-stone-500">
          Ticket QR codes and guest assignments will appear here once you
          purchase tickets.
        </div>
      ) : (
        <div className="space-y-4">
          {groups.map((group) => (
            <div
              key={group.id}
              className="rounded-2xl border border-amber-200/60 bg-white p-6 shadow-sm"
            >
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div className="space-y-1">
                  <h2 className="text-lg font-semibold text-stone-900">
                    {group.ticketName}
                  </h2>
                  <p className="text-xs uppercase tracking-[0.2em] text-stone-400">
                    {group.campaignName ?? "Campaign"} |{" "}
                    {group.orgName ?? "Organization"}
                  </p>
                  <p className="text-xs text-stone-500">
                    Order {group.orderNumber ?? "pending"} |{" "}
                    {group.orderStatus ?? "status pending"} |{" "}
                    {formatDate(group.createdAt)}
                  </p>
                </div>
                <span className="rounded-full border border-amber-200/60 bg-amber-50/40 px-3 py-1 text-xs font-semibold text-stone-600">
                  {group.attendees.length} attendee
                  {group.attendees.length === 1 ? "" : "s"}
                </span>
              </div>
              <div className="mt-4 grid gap-2 text-sm text-stone-600">
                {group.attendees.map((attendee) => (
                  <div
                    key={attendee.id}
                    className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-amber-100 bg-amber-50/40 px-4 py-2"
                  >
                    <div className="space-y-1">
                      <span className="text-stone-900">{attendee.label}</span>
                      {attendee.qrCode ? (
                        <span className="block text-xs text-stone-400">
                          QR {attendee.qrCode}
                        </span>
                      ) : null}
                    </div>
                    <span className="text-xs uppercase tracking-[0.15em] text-stone-400">
                      {attendee.tableName
                        ? `Table ${attendee.tableName}`
                        : attendee.status}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
