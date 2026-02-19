import { redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import { updatePeerFundraiser } from "../fundraiser-actions";

type FundraiserDetailPageProps = {
  params: Promise<{ fundraiserId: string }>;
};

export default async function FundraiserDetailPage({
  params,
}: FundraiserDetailPageProps) {
  const resolvedParams = await params;
  const fundraiser = await prisma.peerFundraiser.findUnique({
    where: { id: resolvedParams.fundraiserId },
  });

  if (!fundraiser) {
    return (
      <div className="rounded-2xl border border-dashed border-amber-200/60 bg-white p-6 text-sm text-stone-500">
        Fundraiser not found.
      </div>
    );
  }

  const [campaign, teams, classrooms] = await Promise.all([
    prisma.campaign.findUnique({
      where: { id: fundraiser.campaignId },
      select: { name: true },
    }),
    prisma.peerFundraisingTeam.findMany({
      where: { campaignId: fundraiser.campaignId },
      orderBy: { createdAt: "desc" },
      select: { id: true, name: true },
    }),
    prisma.peerFundraisingClassroom.findMany({
      where: { campaignId: fundraiser.campaignId },
      orderBy: { createdAt: "desc" },
      select: { id: true, name: true },
    }),
  ]);

  return (
    <div className="space-y-6">
      <header className="space-y-2">
        <h1 className="text-2xl font-semibold text-stone-900">
          {fundraiser.name}
        </h1>
        <p className="text-sm text-stone-600">
          {campaign?.name ?? "Campaign"} | Fundraiser details
        </p>
      </header>

      <form
        className="space-y-6 rounded-2xl border border-amber-200/60 bg-white p-6 shadow-sm"
        action={async (formData) => {
          "use server";
          await updatePeerFundraiser(resolvedParams.fundraiserId, formData);
          redirect(`/admin/peer-to-peer/fundraisers/${resolvedParams.fundraiserId}`);
        }}
      >
        <label className="block text-sm font-semibold text-stone-700">
          Fundraiser name
          <input
            name="name"
            type="text"
            required
            defaultValue={fundraiser.name}
            className="mt-2 w-full rounded-lg border border-amber-200/60 bg-white px-3 py-2 text-sm text-stone-900"
          />
        </label>

        <label className="block text-sm font-semibold text-stone-700">
          Slug
          <input
            name="slug"
            type="text"
            defaultValue={fundraiser.slug}
            className="mt-2 w-full rounded-lg border border-amber-200/60 bg-white px-3 py-2 text-sm text-stone-900"
          />
        </label>

        <label className="block text-sm font-semibold text-stone-700">
          Story
          <textarea
            name="story"
            rows={3}
            defaultValue={fundraiser.story ?? ""}
            className="mt-2 w-full rounded-lg border border-amber-200/60 bg-white px-3 py-2 text-sm text-stone-900"
          />
        </label>

        <div className="grid gap-4 md:grid-cols-2">
          <label className="block text-sm font-semibold text-stone-700">
            Goal (USD)
            <input
              name="goalAmount"
              type="number"
              min="0"
              step="0.01"
              defaultValue={
                fundraiser.goalAmount ? fundraiser.goalAmount / 100 : ""
              }
              className="mt-2 w-full rounded-lg border border-amber-200/60 bg-white px-3 py-2 text-sm text-stone-900"
            />
          </label>

          <label className="block text-sm font-semibold text-stone-700">
            Status
            <select
              name="status"
              defaultValue={fundraiser.status}
              className="mt-2 w-full rounded-lg border border-amber-200/60 bg-white px-3 py-2 text-sm text-stone-900"
            >
              <option value="PUBLISHED">Published</option>
              <option value="DRAFT">Draft</option>
              <option value="ARCHIVED">Archived</option>
            </select>
          </label>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <label className="block text-sm font-semibold text-stone-700">
            Team (optional)
            <select
              name="teamId"
              defaultValue={fundraiser.teamId ?? ""}
              className="mt-2 w-full rounded-lg border border-amber-200/60 bg-white px-3 py-2 text-sm text-stone-900"
            >
              <option value="">No team</option>
              {teams.map((team) => (
                <option key={team.id} value={team.id}>
                  {team.name}
                </option>
              ))}
            </select>
          </label>

          <label className="block text-sm font-semibold text-stone-700">
            Classroom (optional)
            <select
              name="classroomId"
              defaultValue={fundraiser.classroomId ?? ""}
              className="mt-2 w-full rounded-lg border border-amber-200/60 bg-white px-3 py-2 text-sm text-stone-900"
            >
              <option value="">No classroom</option>
              {classrooms.map((classroom) => (
                <option key={classroom.id} value={classroom.id}>
                  {classroom.name}
                </option>
              ))}
            </select>
          </label>
        </div>

        <button
          type="submit"
          className="inline-flex h-10 items-center justify-center rounded-full bg-teal-700 px-5 text-xs font-semibold uppercase tracking-[0.2em] text-white transition hover:bg-teal-800"
        >
          Save changes
        </button>
      </form>
    </div>
  );
}
