import { prisma } from "@/lib/db";

export default async function MessageSendsPage() {
  const sends = await prisma.messageSend.findMany({
    include: {
      emailTemplate: { select: { name: true } },
      smsTemplate: { select: { name: true } },
    },
    orderBy: { createdAt: "desc" },
    take: 100,
  });

  return (
    <div className="space-y-6">
      <header className="space-y-2">
        <h1 className="text-2xl font-semibold text-stone-900">Send history</h1>
        <p className="text-sm text-stone-600">
          Review recent email and SMS sends across campaigns.
        </p>
      </header>

      <div className="rounded-2xl border border-amber-200/60 bg-white shadow-sm">
        <table className="w-full text-left text-sm">
          <thead className="border-b border-amber-200/60 bg-amber-50/40">
            <tr>
              <th className="px-4 py-3 font-semibold text-stone-700">Channel</th>
              <th className="px-4 py-3 font-semibold text-stone-700">Template</th>
              <th className="px-4 py-3 font-semibold text-stone-700">To</th>
              <th className="px-4 py-3 font-semibold text-stone-700">Status</th>
              <th className="px-4 py-3 font-semibold text-stone-700">Scheduled</th>
              <th className="px-4 py-3 font-semibold text-stone-700">Sent</th>
            </tr>
          </thead>
          <tbody>
            {sends.length ? (
              sends.map((send) => (
                <tr key={send.id} className="border-b border-amber-100">
                  <td className="px-4 py-3 font-semibold text-stone-900">
                    {send.channel}
                  </td>
                  <td className="px-4 py-3 text-stone-600">
                    {send.emailTemplate?.name ??
                      send.smsTemplate?.name ??
                      "Manual send"}
                  </td>
                  <td className="px-4 py-3 text-stone-600">{send.to}</td>
                  <td className="px-4 py-3 text-stone-600">{send.status}</td>
                  <td className="px-4 py-3 text-stone-600">
                    {send.scheduledAt
                      ? new Date(send.scheduledAt).toLocaleString()
                      : "—"}
                  </td>
                  <td className="px-4 py-3 text-stone-600">
                    {send.sentAt ? new Date(send.sentAt).toLocaleString() : "—"}
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td className="px-4 py-6 text-center text-stone-500" colSpan={6}>
                  No sends yet.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
