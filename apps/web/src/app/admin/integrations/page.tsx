import Link from "next/link";

export default function IntegrationsPage() {
  return (
    <div className="space-y-6">
      <header className="space-y-2">
        <h1 className="text-2xl font-semibold text-zinc-900">Integrations</h1>
        <p className="text-sm text-zinc-600">
          Manage API tokens, webhooks, and external connectors.
        </p>
      </header>

      <div className="grid gap-4 md:grid-cols-2">
        <div className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm">
          <h2 className="text-sm font-semibold text-zinc-900">API tokens</h2>
          <p className="mt-2 text-sm text-zinc-600">
            Generate scoped tokens for internal apps and integrations.
          </p>
          <Link
            href="/admin/integrations/api-tokens"
            className="mt-4 inline-flex h-10 items-center justify-center rounded-full border border-zinc-200 px-5 text-xs font-semibold uppercase tracking-[0.2em] text-zinc-700 transition hover:border-zinc-300"
          >
            Manage tokens
          </Link>
        </div>
        <div className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm">
          <h2 className="text-sm font-semibold text-zinc-900">Webhooks</h2>
          <p className="mt-2 text-sm text-zinc-600">
            Receive event notifications for donations, tickets, and payouts.
          </p>
          <Link
            href="/admin/integrations/webhooks"
            className="mt-4 inline-flex h-10 items-center justify-center rounded-full border border-zinc-200 px-5 text-xs font-semibold uppercase tracking-[0.2em] text-zinc-700 transition hover:border-zinc-300"
          >
            Manage webhooks
          </Link>
        </div>
      </div>
    </div>
  );
}
