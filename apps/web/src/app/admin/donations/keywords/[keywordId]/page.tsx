import { notFound, redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import { updateKeywordRoute } from "../keyword-actions";

export default async function KeywordRouteDetailPage({
  params,
}: {
  params: { keywordId: string };
}) {
  const [route, campaigns] = await Promise.all([
    prisma.keywordRoute.findUnique({
      where: { id: params.keywordId },
      include: { organization: { select: { publicName: true } } },
    }),
    prisma.campaign.findMany({
      orderBy: { createdAt: "desc" },
      select: { id: true, name: true },
    }),
  ]);

  if (!route) {
    notFound();
  }

  return (
    <div className="space-y-6">
      <header className="space-y-2">
        <p className="text-xs font-semibold uppercase tracking-[0.3em] text-zinc-500">
          {route.organization.publicName}
        </p>
        <h1 className="text-2xl font-semibold text-zinc-900">
          Keyword {route.keyword}
        </h1>
        <p className="text-sm text-zinc-600">Status: {route.status}</p>
      </header>

      <form
        className="space-y-6 rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm"
        action={async (formData) => {
          "use server";
          await updateKeywordRoute(route.id, formData);
          redirect(`/admin/donations/keywords/${route.id}`);
        }}
      >
        <label className="block text-sm font-semibold text-zinc-700">
          Keyword
          <input
            name="keyword"
            type="text"
            required
            defaultValue={route.keyword}
            className="mt-2 w-full rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm text-zinc-900"
          />
        </label>

        <label className="block text-sm font-semibold text-zinc-700">
          Campaign (optional)
          <select
            name="campaignId"
            className="mt-2 w-full rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm text-zinc-900"
            defaultValue={route.campaignId ?? ""}
          >
            <option value="">No campaign</option>
            {campaigns.map((campaign) => (
              <option key={campaign.id} value={campaign.id}>
                {campaign.name}
              </option>
            ))}
          </select>
        </label>

        <label className="block text-sm font-semibold text-zinc-700">
          Auto-reply message
          <textarea
            name="replyMessage"
            rows={3}
            defaultValue={route.replyMessage ?? ""}
            className="mt-2 w-full rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm text-zinc-900"
          />
        </label>

        <label className="block text-sm font-semibold text-zinc-700">
          Status
          <select
            name="status"
            className="mt-2 w-full rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm text-zinc-900"
            defaultValue={route.status}
          >
            <option value="ACTIVE">Active</option>
            <option value="INACTIVE">Inactive</option>
          </select>
        </label>

        <button
          type="submit"
          className="inline-flex h-11 items-center justify-center rounded-full bg-zinc-900 px-6 text-xs font-semibold uppercase tracking-[0.2em] text-white transition hover:bg-zinc-800"
        >
          Update keyword
        </button>
      </form>
    </div>
  );
}
