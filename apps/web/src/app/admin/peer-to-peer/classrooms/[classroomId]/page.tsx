import { redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import { updatePeerClassroom } from "../classroom-actions";

type ClassroomDetailPageProps = {
  params: { classroomId: string };
};

export default async function ClassroomDetailPage({
  params,
}: ClassroomDetailPageProps) {
  const classroom = await prisma.peerFundraisingClassroom.findUnique({
    where: { id: params.classroomId },
  });

  if (!classroom) {
    return (
      <div className="rounded-2xl border border-dashed border-zinc-200 bg-white p-6 text-sm text-zinc-500">
        Classroom not found.
      </div>
    );
  }

  const campaign = await prisma.campaign.findUnique({
    where: { id: classroom.campaignId },
    select: { name: true },
  });

  return (
    <div className="space-y-6">
      <header className="space-y-2">
        <h1 className="text-2xl font-semibold text-zinc-900">
          {classroom.name}
        </h1>
        <p className="text-sm text-zinc-600">
          {campaign?.name ?? "Campaign"} | Classroom details
        </p>
      </header>

      <form
        className="space-y-6 rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm"
        action={async (formData) => {
          "use server";
          await updatePeerClassroom(params.classroomId, formData);
          redirect(`/admin/peer-to-peer/classrooms/${params.classroomId}`);
        }}
      >
        <label className="block text-sm font-semibold text-zinc-700">
          Classroom name
          <input
            name="name"
            type="text"
            required
            defaultValue={classroom.name}
            className="mt-2 w-full rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm text-zinc-900"
          />
        </label>

        <label className="block text-sm font-semibold text-zinc-700">
          Slug
          <input
            name="slug"
            type="text"
            defaultValue={classroom.slug}
            className="mt-2 w-full rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm text-zinc-900"
          />
        </label>

        <div className="grid gap-4 md:grid-cols-2">
          <label className="block text-sm font-semibold text-zinc-700">
            Grade
            <input
              name="grade"
              type="text"
              defaultValue={classroom.grade ?? ""}
              className="mt-2 w-full rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm text-zinc-900"
            />
          </label>
          <label className="block text-sm font-semibold text-zinc-700">
            Teacher name
            <input
              name="teacherName"
              type="text"
              defaultValue={classroom.teacherName ?? ""}
              className="mt-2 w-full rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm text-zinc-900"
            />
          </label>
        </div>

        <label className="block text-sm font-semibold text-zinc-700">
          Story
          <textarea
            name="story"
            rows={3}
            defaultValue={classroom.story ?? ""}
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
            defaultValue={
              classroom.goalAmount ? classroom.goalAmount / 100 : ""
            }
            className="mt-2 w-full rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm text-zinc-900"
          />
        </label>

        <button
          type="submit"
          className="inline-flex h-10 items-center justify-center rounded-full bg-zinc-900 px-5 text-xs font-semibold uppercase tracking-[0.2em] text-white transition hover:bg-zinc-800"
        >
          Save changes
        </button>
      </form>
    </div>
  );
}
