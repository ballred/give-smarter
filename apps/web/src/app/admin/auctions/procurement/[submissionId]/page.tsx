import { notFound } from "next/navigation";
import { prisma } from "@/lib/db";
import { updateProcurementSubmission } from "./procurement-actions";

export default async function ProcurementDetailPage({
  params,
}: {
  params: Promise<{ submissionId: string }>;
}) {
  const resolvedParams = await params;
  const submission = await prisma.procurementSubmission.findUnique({
    where: { id: resolvedParams.submissionId },
    include: {
      procurementDonor: true,
      campaign: { select: { name: true } },
    },
  });

  if (!submission) {
    notFound();
  }

  return (
    <div className="space-y-6">
      <header className="space-y-2">
        <p className="text-xs font-semibold uppercase tracking-[0.3em] text-zinc-500">
          {submission.campaign?.name ?? "Auction"}
        </p>
        <h1 className="text-2xl font-semibold text-zinc-900">
          {submission.itemTitle ?? "Procurement submission"}
        </h1>
        <p className="text-sm text-zinc-600">
          Status: {submission.status}
        </p>
      </header>

      <div className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm">
        <div className="grid gap-4 md:grid-cols-2">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-zinc-500">
              Donor
            </p>
            <p className="mt-2 text-sm text-zinc-900">
              {submission.procurementDonor?.name ?? "—"}
            </p>
            <p className="text-sm text-zinc-600">
              {submission.procurementDonor?.email ?? "No email"} ·{" "}
              {submission.procurementDonor?.phone ?? "No phone"}
            </p>
          </div>
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-zinc-500">
              FMV
            </p>
            <p className="mt-2 text-sm text-zinc-900">
              {submission.fmvAmount
                ? `$${(submission.fmvAmount / 100).toFixed(2)}`
                : "—"}
            </p>
            <p className="text-sm text-zinc-600">
              Restrictions: {submission.restrictions ?? "—"}
            </p>
          </div>
        </div>
      </div>

      <form
        className="space-y-4 rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm"
        action={async (formData) => {
          "use server";
          await updateProcurementSubmission(submission.id, formData);
        }}
      >
        <label className="block text-sm font-semibold text-zinc-700">
          Status
          <select
            name="status"
            defaultValue={submission.status}
            className="mt-2 w-full rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm text-zinc-900"
          >
            <option value="PLEDGED">Pledged</option>
            <option value="RECEIVED">Received</option>
            <option value="CATALOGED">Cataloged</option>
            <option value="PUBLISHED">Published</option>
            <option value="FULFILLED">Fulfilled</option>
          </select>
        </label>

        <label className="block text-sm font-semibold text-zinc-700">
          Item title
          <input
            name="itemTitle"
            type="text"
            defaultValue={submission.itemTitle ?? ""}
            className="mt-2 w-full rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm text-zinc-900"
          />
        </label>

        <label className="block text-sm font-semibold text-zinc-700">
          Notes
          <textarea
            name="notes"
            rows={3}
            defaultValue={submission.notes ?? ""}
            className="mt-2 w-full rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm text-zinc-900"
          />
        </label>

        <button
          type="submit"
          className="inline-flex h-10 items-center justify-center rounded-full bg-zinc-900 px-5 text-xs font-semibold uppercase tracking-[0.2em] text-white transition hover:bg-zinc-800"
        >
          Update submission
        </button>
      </form>
    </div>
  );
}
