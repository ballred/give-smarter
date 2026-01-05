import { prisma } from "@/lib/db";
import { checkInAttendee } from "./checkin-actions";

type SearchParams = {
  q?: string;
};

export default async function CheckInPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const query = searchParams.q?.trim() ?? "";
  const attendees = query
    ? await prisma.attendee.findMany({
        where: {
          OR: [
            { firstName: { contains: query, mode: "insensitive" } },
            { lastName: { contains: query, mode: "insensitive" } },
            { email: { contains: query, mode: "insensitive" } },
            { phone: { contains: query, mode: "insensitive" } },
          ],
        },
        take: 25,
        orderBy: { createdAt: "desc" },
      })
    : [];

  return (
    <div className="space-y-6">
      <header className="space-y-2">
        <h1 className="text-2xl font-semibold text-zinc-900">Check-in</h1>
        <p className="text-sm text-zinc-600">
          Search attendees and check them in quickly.
        </p>
      </header>

      <form className="flex flex-wrap gap-3" method="get">
        <input
          name="q"
          defaultValue={query}
          placeholder="Search by name, email, or phone"
          className="h-11 flex-1 rounded-full border border-zinc-200 bg-white px-5 text-sm text-zinc-900"
        />
        <button
          type="submit"
          className="inline-flex h-11 items-center justify-center rounded-full bg-zinc-900 px-6 text-xs font-semibold uppercase tracking-[0.2em] text-white transition hover:bg-zinc-800"
        >
          Search
        </button>
      </form>

      <div className="rounded-2xl border border-zinc-200 bg-white shadow-sm">
        <table className="w-full text-left text-sm">
          <thead className="border-b border-zinc-200 bg-zinc-50">
            <tr>
              <th className="px-4 py-3 font-semibold text-zinc-700">Attendee</th>
              <th className="px-4 py-3 font-semibold text-zinc-700">Email</th>
              <th className="px-4 py-3 font-semibold text-zinc-700">Status</th>
              <th className="px-4 py-3 font-semibold text-zinc-700">Action</th>
            </tr>
          </thead>
          <tbody>
            {attendees.length ? (
              attendees.map((attendee) => (
                <tr key={attendee.id} className="border-b border-zinc-100">
                  <td className="px-4 py-3 font-semibold text-zinc-900">
                    {attendee.firstName} {attendee.lastName}
                  </td>
                  <td className="px-4 py-3 text-zinc-600">
                    {attendee.email ?? "—"}
                  </td>
                  <td className="px-4 py-3 text-zinc-600">
                    {attendee.status}
                  </td>
                  <td className="px-4 py-3">
                    <form
                      action={async () => {
                        "use server";
                        await checkInAttendee(attendee.id);
                      }}
                    >
                      <button
                        type="submit"
                        className="rounded-full border border-zinc-200 px-4 py-2 text-xs font-semibold uppercase tracking-[0.2em] text-zinc-600 transition hover:border-zinc-300"
                      >
                        Check in
                      </button>
                    </form>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td
                  className="px-4 py-6 text-center text-zinc-500"
                  colSpan={4}
                >
                  {query ? "No matches found." : "Search to begin."}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
