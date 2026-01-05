import Link from "next/link";
import { prisma } from "@/lib/db";

export default async function KeywordRoutesPage() {
  const routes = await prisma.keywordRoute.findMany({
    include: {
      organization: { select: { publicName: true } },
      campaign: { select: { name: true } },
    },
    orderBy: { createdAt: "desc" },
  });

  return (
    <div className="space-y-6">
      <header className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-zinc-900">
            Text-to-give keywords
          </h1>
          <p className="text-sm text-zinc-600">
            Route SMS keywords to campaigns and auto-replies.
          </p>
        </div>
        <Link
          className="inline-flex h-10 items-center justify-center rounded-full bg-zinc-900 px-5 text-xs font-semibold uppercase tracking-[0.2em] text-white transition hover:bg-zinc-800"
          href="/admin/donations/keywords/new"
        >
          New keyword
        </Link>
      </header>

      <div className="rounded-2xl border border-zinc-200 bg-white shadow-sm">
        <table className="w-full text-left text-sm">
          <thead className="border-b border-zinc-200 bg-zinc-50">
            <tr>
              <th className="px-4 py-3 font-semibold text-zinc-700">Keyword</th>
              <th className="px-4 py-3 font-semibold text-zinc-700">Org</th>
              <th className="px-4 py-3 font-semibold text-zinc-700">Campaign</th>
              <th className="px-4 py-3 font-semibold text-zinc-700">Status</th>
              <th className="px-4 py-3 font-semibold text-zinc-700">Reply</th>
            </tr>
          </thead>
          <tbody>
            {routes.length ? (
              routes.map((route) => (
                <tr key={route.id} className="border-b border-zinc-100">
                  <td className="px-4 py-3 font-semibold text-zinc-900">
                    <Link
                      className="text-zinc-900 hover:text-zinc-700"
                      href={`/admin/donations/keywords/${route.id}`}
                    >
                      {route.keyword}
                    </Link>
                  </td>
                  <td className="px-4 py-3 text-zinc-600">
                    {route.organization.publicName}
                  </td>
                  <td className="px-4 py-3 text-zinc-600">
                    {route.campaign?.name ?? "—"}
                  </td>
                  <td className="px-4 py-3 text-zinc-600">{route.status}</td>
                  <td className="px-4 py-3 text-zinc-600">
                    {route.replyMessage
                      ? route.replyMessage.length > 40
                        ? `${route.replyMessage.slice(0, 40)}…`
                        : route.replyMessage
                      : "—"}
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td className="px-4 py-6 text-center text-zinc-500" colSpan={5}>
                  No keywords yet.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
