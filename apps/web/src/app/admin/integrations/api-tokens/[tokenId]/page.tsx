import { notFound, redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import { apiTokenScopes, updateApiToken } from "../token-actions";

function isScopeSelected(scopes: string[], scope: string) {
  return scopes.includes(scope);
}

export default async function ApiTokenDetailPage({
  params,
  searchParams,
}: {
  params: { tokenId: string };
  searchParams?: { token?: string };
}) {
  const token = await prisma.apiToken.findUnique({
    where: { id: params.tokenId },
    include: { organization: { select: { publicName: true } } },
  });

  if (!token) {
    notFound();
  }

  return (
    <div className="space-y-6">
      <header className="space-y-2">
        <p className="text-xs font-semibold uppercase tracking-[0.3em] text-zinc-500">
          {token.organization.publicName}
        </p>
        <h1 className="text-2xl font-semibold text-zinc-900">{token.name}</h1>
        <p className="text-sm text-zinc-600">
          Last used {token.lastUsedAt ? new Date(token.lastUsedAt).toLocaleString() : "—"}
        </p>
      </header>

      {searchParams?.token ? (
        <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-5 text-sm text-emerald-900">
          <p className="font-semibold">New token generated</p>
          <p className="mt-2 break-all font-mono text-xs text-emerald-800">
            {searchParams.token}
          </p>
          <p className="mt-2 text-xs text-emerald-700">
            Copy this token now. You won&apos;t be able to see it again.
          </p>
        </div>
      ) : null}

      <form
        className="space-y-6 rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm"
        action={async (formData) => {
          "use server";
          await updateApiToken(token.id, formData);
          redirect(`/admin/integrations/api-tokens/${token.id}`);
        }}
      >
        <label className="block text-sm font-semibold text-zinc-700">
          Token name
          <input
            name="name"
            type="text"
            required
            defaultValue={token.name}
            className="mt-2 w-full rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm text-zinc-900"
          />
        </label>

        <fieldset className="space-y-3">
          <legend className="text-sm font-semibold text-zinc-700">Scopes</legend>
          <div className="grid gap-3 md:grid-cols-2">
            {apiTokenScopes.map((scope) => (
              <label key={scope} className="flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  name="scopes"
                  value={scope}
                  defaultChecked={isScopeSelected(token.scopes, scope)}
                  className="h-4 w-4 rounded border-zinc-300 text-zinc-900"
                />
                <span className="text-zinc-700">{scope}</span>
              </label>
            ))}
          </div>
        </fieldset>

        <button
          type="submit"
          className="inline-flex h-11 items-center justify-center rounded-full bg-zinc-900 px-6 text-xs font-semibold uppercase tracking-[0.2em] text-white transition hover:bg-zinc-800"
        >
          Update token
        </button>
      </form>
    </div>
  );
}
