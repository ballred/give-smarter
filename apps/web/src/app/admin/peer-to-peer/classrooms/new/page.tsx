import { redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import { createPeerClassroom } from "../classroom-actions";

export default async function NewClassroomPage() {
  const campaigns = await prisma.campaign.findMany({
    orderBy: { createdAt: "desc" },
    select: { id: true, name: true },
  });

  return (
    <div className="space-y-6">
      <header className="space-y-2">
        <h1 className="text-2xl font-semibold text-zinc-900">
          Create classroom
        </h1>
        <p className="text-sm text-zinc-600">
          Add a classroom to the peer-to-peer campaign.
        </p>
      </header>

      <form
        className="space-y-6 rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm"
        action={async (formData) => {
          "use server";
          const id = await createPeerClassroom(formData);
          redirect(`/admin/peer-to-peer/classrooms/${id}`);
        }}
      >
        <label className="block text-sm font-semibold text-zinc-700">
          Campaign
          <select
            name="campaignId"
            required
            className="mt-2 w-full rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm text-zinc-900"
          >
            <option value="" disabled>
              Select a campaign
            </option>
            {campaigns.map((campaign) => (
              <option key={campaign.id} value={campaign.id}>
                {campaign.name}
              </option>
            ))}
          </select>
        </label>

        <label className="block text-sm font-semibold text-zinc-700">
          Classroom name
          <input
            name="name"
            type="text"
            required
            className="mt-2 w-full rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm text-zinc-900"
          />
        </label>

        <label className="block text-sm font-semibold text-zinc-700">
          Slug
          <input
            name="slug"
            type="text"
            placeholder="auto-generated if blank"
            className="mt-2 w-full rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm text-zinc-900"
          />
        </label>

        <div className="grid gap-4 md:grid-cols-2">
          <label className="block text-sm font-semibold text-zinc-700">
            Grade
            <input
              name="grade"
              type="text"
              className="mt-2 w-full rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm text-zinc-900"
            />
          </label>
          <label className="block text-sm font-semibold text-zinc-700">
            Teacher name
            <input
              name="teacherName"
              type="text"
              className="mt-2 w-full rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm text-zinc-900"
            />
          </label>
        </div>

        <label className="block text-sm font-semibold text-zinc-700">
          Story
          <textarea
            name="story"
            rows={3}
            className="mt-2 w-full rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm text-zinc-900"
          />
        </label>

        <label className="block text-sm font-semibold text-zinc-700">
          Goal (USD)
          <input
            name="goalAmount"
            type="number"
            min="0"
            step="0.01"
            className="mt-2 w-full rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm text-zinc-900"
          />
        </label>

        <button
          type="submit"
          className="inline-flex h-10 items-center justify-center rounded-full bg-zinc-900 px-5 text-xs font-semibold uppercase tracking-[0.2em] text-white transition hover:bg-zinc-800"
        >
          Create classroom
        </button>
      </form>
    </div>
  );
}
