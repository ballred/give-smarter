import Link from "next/link";
import { prisma } from "@/lib/db";

export default async function ApiTokensPage() {
  const tokens = await prisma.apiToken.findMany({
    include: { organization: { select: { publicName: true } } },
    orderBy: { createdAt: "desc" },
  });

  return (
    <div className="space-y-6">
      <header className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-zinc-900">API tokens</h1>
          <p className="text-sm text-zinc-600">
            Use scoped tokens for secure API access.
          </p>
        </div>
        <Link
          className="inline-flex h-10 items-center justify-center rounded-full bg-zinc-900 px-5 text-xs font-semibold uppercase tracking-[0.2em] text-white transition hover:bg-zinc-800"
          href="/admin/integrations/api-tokens/new"
        >
          New token
        </Link>
      </header>

      <div className="rounded-2xl border border-zinc-200 bg-white shadow-sm">
        <table className="w-full text-left text-sm">
          <thead className="border-b border-zinc-200 bg-zinc-50">
            <tr>
              <th className="px-4 py-3 font-semibold text-zinc-700">Name</th>
              <th className="px-4 py-3 font-semibold text-zinc-700">Org</th>
              <th className="px-4 py-3 font-semibold text-zinc-700">Scopes</th>
              <th className="px-4 py-3 font-semibold text-zinc-700">Last used</th>
            </tr>
          </thead>
          <tbody>
            {tokens.length ? (
              tokens.map((token) => (
                <tr key={token.id} className="border-b border-zinc-100">
                  <td className="px-4 py-3 font-semibold text-zinc-900">
                    <Link
                      className="text-zinc-900 hover:text-zinc-700"
                      href={`/admin/integrations/api-tokens/${token.id}`}
                    >
                      {token.name}
                    </Link>
                  </td>
                  <td className="px-4 py-3 text-zinc-600">
                    {token.organization.publicName}
                  </td>
                  <td className="px-4 py-3 text-zinc-600">
                    {token.scopes.join(", ")}
                  </td>
                  <td className="px-4 py-3 text-zinc-600">
                    {token.lastUsedAt
                      ? new Date(token.lastUsedAt).toLocaleString()
                      : "—"}
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td className="px-4 py-6 text-center text-zinc-500" colSpan={4}>
                  No API tokens yet.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
