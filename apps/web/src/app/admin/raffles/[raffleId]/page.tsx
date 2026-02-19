import { notFound } from "next/navigation";
import { prisma } from "@/lib/db";
import { drawRaffleWinner } from "./raffle-draw-actions";

export default async function RaffleDetailPage({
  params,
}: {
  params: Promise<{ raffleId: string }>;
}) {
  const resolvedParams = await params;
  const raffle = await prisma.raffle.findUnique({
    where: { id: resolvedParams.raffleId },
    include: {
      campaign: { select: { name: true } },
      draws: { orderBy: { drawnAt: "desc" } },
      tickets: true,
    },
  });

  if (!raffle) {
    notFound();
  }

  return (
    <div className="space-y-6">
      <header className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.3em] text-stone-500">
            {raffle.campaign?.name ?? "Campaign"}
          </p>
          <h1 className="text-2xl font-semibold text-stone-900">
            {raffle.name}
          </h1>
          <p className="text-sm text-stone-600">
            Tickets sold: {raffle.tickets.length}
          </p>
        </div>
        <form
          action={async () => {
            "use server";
            await drawRaffleWinner(raffle.id);
          }}
        >
          <button
            type="submit"
            className="inline-flex h-10 items-center justify-center rounded-full bg-teal-700 px-5 text-xs font-semibold uppercase tracking-[0.2em] text-white transition hover:bg-teal-800"
          >
            Draw winner
          </button>
        </form>
      </header>

      <div className="rounded-2xl border border-amber-200/60 bg-white shadow-sm">
        <table className="w-full text-left text-sm">
          <thead className="border-b border-amber-200/60 bg-amber-50/40">
            <tr>
              <th className="px-4 py-3 font-semibold text-stone-700">
                Drawn at
              </th>
              <th className="px-4 py-3 font-semibold text-stone-700">
                Winner donor ID
              </th>
              <th className="px-4 py-3 font-semibold text-stone-700">Notes</th>
            </tr>
          </thead>
          <tbody>
            {raffle.draws.length ? (
              raffle.draws.map((draw) => (
                <tr key={draw.id} className="border-b border-amber-100">
                  <td className="px-4 py-3 text-stone-600">
                    {new Date(draw.drawnAt).toLocaleString()}
                  </td>
                  <td className="px-4 py-3 text-stone-600">
                    {draw.winnerDonorId ?? "—"}
                  </td>
                  <td className="px-4 py-3 text-stone-600">
                    {draw.notes ?? "—"}
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td
                  className="px-4 py-6 text-center text-stone-500"
                  colSpan={3}
                >
                  No draws yet.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
