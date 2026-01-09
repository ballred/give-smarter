import { prisma } from "@/lib/db";
import { AttendeeStatus } from "@prisma/client";

export default async function AttendanceReportPage() {
  const attendees = await prisma.attendee.findMany({
    include: {
      campaign: { select: { name: true } },
      ticketType: { select: { name: true } },
      checkins: { take: 1, orderBy: { checkedInAt: "desc" } },
    },
    orderBy: { createdAt: "desc" },
    take: 100,
  });

  const checkedIn = attendees.filter((a) => a.checkins.length > 0);
  const registered = attendees.filter(
    (a) => a.status === AttendeeStatus.REGISTERED
  );
  const cancelled = attendees.filter(
    (a) => a.status === AttendeeStatus.CANCELED
  );

  const checkInRate =
    registered.length > 0
      ? ((checkedIn.length / registered.length) * 100).toFixed(1)
      : "0";

  return (
    <div className="space-y-6">
      <header className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-zinc-900">
            Attendance Report
          </h1>
          <p className="text-sm text-zinc-600">
            Overview of attendees and check-in status.
          </p>
        </div>
        <a
          href="/api/admin/reports/attendance?format=csv"
          className="inline-flex h-10 items-center justify-center rounded-full bg-zinc-900 px-5 text-xs font-semibold uppercase tracking-[0.2em] text-white transition hover:bg-zinc-800"
        >
          Export CSV
        </a>
      </header>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-zinc-500">
            Total Attendees
          </p>
          <p className="mt-2 text-2xl font-bold text-zinc-900">
            {attendees.length}
          </p>
          <p className="mt-1 text-xs text-zinc-500">All registrations</p>
        </div>
        <div className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-zinc-500">
            Registered
          </p>
          <p className="mt-2 text-2xl font-bold text-emerald-600">
            {registered.length}
          </p>
          <p className="mt-1 text-xs text-zinc-500">Ready to attend</p>
        </div>
        <div className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-zinc-500">
            Checked In
          </p>
          <p className="mt-2 text-2xl font-bold text-sky-600">
            {checkedIn.length}
          </p>
          <p className="mt-1 text-xs text-zinc-500">{checkInRate}% check-in rate</p>
        </div>
        <div className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-zinc-500">
            Cancelled
          </p>
          <p className="mt-2 text-2xl font-bold text-zinc-900">
            {cancelled.length}
          </p>
          <p className="mt-1 text-xs text-zinc-500">Cancelled registrations</p>
        </div>
      </div>

      <div className="rounded-2xl border border-zinc-200 bg-white shadow-sm">
        <div className="border-b border-zinc-200 px-5 py-4">
          <h2 className="font-semibold text-zinc-900">Recent Registrations</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-zinc-200 bg-zinc-50">
              <tr>
                <th className="px-4 py-3 font-semibold text-zinc-700">Name</th>
                <th className="px-4 py-3 font-semibold text-zinc-700">
                  Campaign
                </th>
                <th className="px-4 py-3 font-semibold text-zinc-700">
                  Ticket
                </th>
                <th className="px-4 py-3 font-semibold text-zinc-700">Email</th>
                <th className="px-4 py-3 font-semibold text-zinc-700">
                  Status
                </th>
                <th className="px-4 py-3 font-semibold text-zinc-700">
                  Checked In
                </th>
              </tr>
            </thead>
            <tbody>
              {attendees.length > 0 ? (
                attendees.map((attendee) => {
                  const isCheckedIn = attendee.checkins.length > 0;
                  const name =
                    [attendee.firstName, attendee.lastName]
                      .filter(Boolean)
                      .join(" ") || "—";

                  return (
                    <tr key={attendee.id} className="border-b border-zinc-100">
                      <td className="px-4 py-3 font-medium text-zinc-900">
                        {name}
                      </td>
                      <td className="px-4 py-3 text-zinc-600">
                        {attendee.campaign?.name ?? "—"}
                      </td>
                      <td className="px-4 py-3 text-zinc-600">
                        {attendee.ticketType?.name ?? "—"}
                      </td>
                      <td className="px-4 py-3 text-zinc-600">
                        {attendee.email ?? "—"}
                      </td>
                      <td className="px-4 py-3">
                        <span
                          className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${
                            attendee.status === AttendeeStatus.REGISTERED
                              ? "bg-emerald-100 text-emerald-700"
                              : "bg-red-100 text-red-700"
                          }`}
                        >
                          {attendee.status.toLowerCase()}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        {isCheckedIn ? (
                          <span className="inline-flex items-center gap-1.5 text-sky-600">
                            <svg
                              className="h-4 w-4"
                              fill="currentColor"
                              viewBox="0 0 20 20"
                            >
                              <path
                                fillRule="evenodd"
                                d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                                clipRule="evenodd"
                              />
                            </svg>
                            {new Date(
                              attendee.checkins[0]!.checkedInAt
                            ).toLocaleTimeString()}
                          </span>
                        ) : (
                          <span className="text-zinc-400">—</span>
                        )}
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td
                    className="px-4 py-8 text-center text-zinc-500"
                    colSpan={6}
                  >
                    No attendees yet.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
