import { prisma } from "@/lib/db";
import { assignTable } from "./attendee-actions";

type SearchParams = {
  q?: string;
};

export default async function AttendeesPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const resolvedSearchParams = await searchParams;
  const query = resolvedSearchParams.q?.trim() ?? "";
  const [attendees, tables] = await Promise.all([
    prisma.attendee.findMany({
      where: query
        ? {
            OR: [
              { firstName: { contains: query, mode: "insensitive" } },
              { lastName: { contains: query, mode: "insensitive" } },
              { email: { contains: query, mode: "insensitive" } },
            ],
          }
        : undefined,
      include: {
        campaign: { select: { id: true, name: true } },
        ticketType: { select: { name: true } },
        table: { select: { id: true, name: true } },
      },
      orderBy: { createdAt: "desc" },
      take: 50,
    }),
    prisma.table.findMany({
      include: { campaign: { select: { id: true, name: true } } },
      orderBy: [{ campaignId: "asc" }, { name: "asc" }],
    }),
  ]);

  const tablesByCampaign = new Map<string, typeof tables>();
  for (const table of tables) {
    const existing = tablesByCampaign.get(table.campaignId);
    if (existing) {
      existing.push(table);
    } else {
      tablesByCampaign.set(table.campaignId, [table]);
    }
  }

  return (
    <div className="space-y-6">
      <header className="space-y-2">
        <h1 className="text-2xl font-semibold text-stone-900">
          Attendee seating
        </h1>
        <p className="text-sm text-stone-600">
          Assign attendees to tables for faster check-in.
        </p>
      </header>

      <form className="flex flex-wrap gap-3" method="get">
        <input
          name="q"
          defaultValue={query}
          placeholder="Search by name or email"
          className="h-11 flex-1 rounded-full border border-amber-200/60 bg-white px-5 text-sm text-stone-900"
        />
        <button
          type="submit"
          className="inline-flex h-11 items-center justify-center rounded-full bg-teal-700 px-6 text-xs font-semibold uppercase tracking-[0.2em] text-white transition hover:bg-teal-800"
        >
          Search
        </button>
      </form>

      <div className="rounded-2xl border border-amber-200/60 bg-white shadow-sm">
        <table className="w-full text-left text-sm">
          <thead className="border-b border-amber-200/60 bg-amber-50/40">
            <tr>
              <th className="px-4 py-3 font-semibold text-stone-700">
                Attendee
              </th>
              <th className="px-4 py-3 font-semibold text-stone-700">Email</th>
              <th className="px-4 py-3 font-semibold text-stone-700">
                Campaign
              </th>
              <th className="px-4 py-3 font-semibold text-stone-700">Ticket</th>
              <th className="px-4 py-3 font-semibold text-stone-700">Table</th>
            </tr>
          </thead>
          <tbody>
            {attendees.length ? (
              attendees.map((attendee) => {
                const campaignTables =
                  tablesByCampaign.get(attendee.campaignId) ?? [];
                return (
                  <tr key={attendee.id} className="border-b border-amber-100">
                    <td className="px-4 py-3 font-semibold text-stone-900">
                      {attendee.firstName} {attendee.lastName}
                    </td>
                    <td className="px-4 py-3 text-stone-600">
                      {attendee.email ?? "—"}
                    </td>
                    <td className="px-4 py-3 text-stone-600">
                      {attendee.campaign?.name ?? "—"}
                    </td>
                    <td className="px-4 py-3 text-stone-600">
                      {attendee.ticketType?.name ?? "—"}
                    </td>
                    <td className="px-4 py-3">
                      <form
                        action={assignTable}
                        className="flex items-center gap-2"
                      >
                        <input
                          type="hidden"
                          name="attendeeId"
                          value={attendee.id}
                        />
                        <select
                          name="tableId"
                          defaultValue={attendee.tableId ?? ""}
                          className="h-9 rounded-full border border-amber-200/60 bg-white px-4 text-sm text-stone-900"
                        >
                          <option value="">Unassigned</option>
                          {campaignTables.map((table) => (
                            <option key={table.id} value={table.id}>
                              {table.name}
                            </option>
                          ))}
                        </select>
                        <button
                          type="submit"
                          className="inline-flex h-9 items-center justify-center rounded-full border border-amber-200/60 px-3 text-xs font-semibold uppercase tracking-[0.2em] text-stone-700 transition hover:border-amber-300"
                        >
                          Save
                        </button>
                      </form>
                    </td>
                  </tr>
                );
              })
            ) : (
              <tr>
                <td
                  className="px-4 py-6 text-center text-stone-500"
                  colSpan={5}
                >
                  {query ? "No matches found." : "No attendees yet."}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
