import { redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import { apiTokenScopes, createApiToken } from "../token-actions";

export default async function NewApiTokenPage() {
  const organizations = await prisma.organization.findMany({
    orderBy: { createdAt: "desc" },
    select: { id: true, publicName: true },
  });

  if (!organizations.length) {
    return (
      <div className="space-y-4">
        <h1 className="text-2xl font-semibold text-stone-900">New API token</h1>
        <p className="text-sm text-stone-600">
          Create an organization before generating tokens.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <header className="space-y-2">
        <h1 className="text-2xl font-semibold text-stone-900">New API token</h1>
        <p className="text-sm text-stone-600">
          Generate a token and choose scopes for access.
        </p>
      </header>

      <form
        className="space-y-6 rounded-2xl border border-amber-200/60 bg-white p-6 shadow-sm"
        action={async (formData) => {
          "use server";
          const result = await createApiToken(formData);
          redirect(`/admin/integrations/api-tokens/${result.id}?token=${result.token}`);
        }}
      >
        <label className="block text-sm font-semibold text-stone-700">
          Organization
          <select
            name="orgId"
            className="mt-2 w-full rounded-lg border border-amber-200/60 bg-white px-3 py-2 text-sm text-stone-900"
            required
          >
            {organizations.map((org) => (
              <option key={org.id} value={org.id}>
                {org.publicName}
              </option>
            ))}
          </select>
        </label>

        <label className="block text-sm font-semibold text-stone-700">
          Token name
          <input
            name="name"
            type="text"
            required
            className="mt-2 w-full rounded-lg border border-amber-200/60 bg-white px-3 py-2 text-sm text-stone-900"
            placeholder="Data warehouse sync"
          />
        </label>

        <fieldset className="space-y-3">
          <legend className="text-sm font-semibold text-stone-700">Scopes</legend>
          <div className="grid gap-3 md:grid-cols-2">
            {apiTokenScopes.map((scope) => (
              <label key={scope} className="flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  name="scopes"
                  value={scope}
                  className="h-4 w-4 rounded border-amber-300 text-teal-600"
                />
                <span className="text-stone-700">{scope}</span>
              </label>
            ))}
          </div>
        </fieldset>

        <button
          type="submit"
          className="inline-flex h-11 items-center justify-center rounded-full bg-teal-700 px-6 text-xs font-semibold uppercase tracking-[0.2em] text-white transition hover:bg-teal-800"
        >
          Generate token
        </button>
      </form>
    </div>
  );
}
