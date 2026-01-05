import { redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import { updateVolunteerShift } from "../shift-actions";

type VolunteerShiftPageProps = {
  params: { shiftId: string };
};

function toLocalInput(date: Date | null) {
  if (!date) return "";
  const offset = date.getTimezoneOffset() * 60000;
  return new Date(date.getTime() - offset).toISOString().slice(0, 16);
}

export default async function VolunteerShiftDetailPage({
  params,
}: VolunteerShiftPageProps) {
  const shift = await prisma.volunteerShift.findUnique({
    where: { id: params.shiftId },
    include: {
      campaign: { select: { name: true } },
      signups: {
        include: { donor: { select: { displayName: true, primaryEmail: true } } },
        orderBy: { createdAt: "desc" },
      },
    },
  });

  if (!shift) {
    return (
      <div className="rounded-2xl border border-dashed border-zinc-200 bg-white p-6 text-sm text-zinc-500">
        Shift not found.
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <header className="space-y-2">
        <h1 className="text-2xl font-semibold text-zinc-900">{shift.name}</h1>
        <p className="text-sm text-zinc-600">
          {shift.campaign?.name ?? "Campaign"} | Volunteer shift
        </p>
      </header>

      <form
        className="space-y-6 rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm"
        action={async (formData) => {
          "use server";
          await updateVolunteerShift(params.shiftId, formData);
          redirect(`/admin/volunteers/${params.shiftId}`);
        }}
      >
        <label className="block text-sm font-semibold text-zinc-700">
          Shift name
          <input
            name="name"
            type="text"
            required
            defaultValue={shift.name}
            className="mt-2 w-full rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm text-zinc-900"
          />
        </label>

        <label className="block text-sm font-semibold text-zinc-700">
          Description
          <textarea
            name="description"
            rows={3}
            defaultValue={shift.description ?? ""}
            className="mt-2 w-full rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm text-zinc-900"
          />
        </label>

        <div className="grid gap-4 md:grid-cols-2">
          <label className="block text-sm font-semibold text-zinc-700">
            Start time
            <input
              name="startsAt"
              type="datetime-local"
              defaultValue={toLocalInput(shift.startsAt)}
              className="mt-2 w-full rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm text-zinc-900"
            />
          </label>
          <label className="block text-sm font-semibold text-zinc-700">
            End time
            <input
              name="endsAt"
              type="datetime-local"
              defaultValue={toLocalInput(shift.endsAt)}
              className="mt-2 w-full rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm text-zinc-900"
            />
          </label>
        </div>

        <label className="block text-sm font-semibold text-zinc-700">
          Capacity
          <input
            name="capacity"
            type="number"
            min="0"
            defaultValue={shift.capacity ?? ""}
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

      <div className="flex justify-end">
        <a
          href={`/api/admin/volunteers/${shift.id}/signups?format=csv`}
          className="inline-flex h-10 items-center justify-center rounded-full border border-zinc-200 px-5 text-xs font-semibold uppercase tracking-[0.2em] text-zinc-700 transition hover:border-zinc-300"
        >
          Download CSV
        </a>
      </div>

      <div className="rounded-2xl border border-zinc-200 bg-white shadow-sm">
        <table className="w-full text-left text-sm">
          <thead className="border-b border-zinc-200 bg-zinc-50">
            <tr>
              <th className="px-4 py-3 font-semibold text-zinc-700">Volunteer</th>
              <th className="px-4 py-3 font-semibold text-zinc-700">Email</th>
              <th className="px-4 py-3 font-semibold text-zinc-700">Status</th>
            </tr>
          </thead>
          <tbody>
            {shift.signups.length ? (
              shift.signups.map((signup) => (
                <tr key={signup.id} className="border-b border-zinc-100">
                  <td className="px-4 py-3 text-zinc-600">
                    {signup.name}
                  </td>
                  <td className="px-4 py-3 text-zinc-600">
                    {signup.email ?? signup.donor?.primaryEmail ?? "--"}
                  </td>
                  <td className="px-4 py-3 text-zinc-600">
                    {signup.status}
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td
                  className="px-4 py-6 text-center text-zinc-500"
                  colSpan={3}
                >
                  No volunteers signed up yet.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
