import { redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import { addHouseholdMember } from "../household-actions";

type HouseholdDetailPageProps = {
  params: Promise<{ householdId: string }>;
};

export default async function HouseholdDetailPage({
  params,
}: HouseholdDetailPageProps) {
  const resolvedParams = await params;
  const household = await prisma.household.findUnique({
    where: { id: resolvedParams.householdId },
    include: {
      organization: { select: { publicName: true } },
      memberships: {
        include: { donor: { select: { displayName: true, primaryEmail: true } } },
      },
    },
  });

  if (!household) {
    return (
      <div className="rounded-2xl border border-dashed border-amber-200/60 bg-white p-6 text-sm text-stone-500">
        Household not found.
      </div>
    );
  }

  const donors = await prisma.donor.findMany({
    where: { orgId: household.orgId },
    orderBy: { createdAt: "desc" },
    select: { id: true, displayName: true, primaryEmail: true },
  });

  return (
    <div className="space-y-6">
      <header className="space-y-2">
        <h1 className="text-2xl font-semibold text-stone-900">
          {household.name}
        </h1>
        <p className="text-sm text-stone-600">
          {household.organization.publicName} | Household
        </p>
      </header>

      <form
        className="space-y-4 rounded-2xl border border-amber-200/60 bg-white p-6 shadow-sm"
        action={async (formData) => {
          "use server";
          await addHouseholdMember(resolvedParams.householdId, formData);
          redirect(`/admin/households/${resolvedParams.householdId}`);
        }}
      >
        <div className="grid gap-4 md:grid-cols-2">
          <label className="block text-sm font-semibold text-stone-700">
            Add donor
            <select
              name="donorId"
              required
              className="mt-2 w-full rounded-lg border border-amber-200/60 bg-white px-3 py-2 text-sm text-stone-900"
            >
              <option value="" disabled>
                Select a donor
              </option>
              {donors.map((donor) => (
                <option key={donor.id} value={donor.id}>
                  {donor.displayName ?? donor.primaryEmail ?? "Donor"}
                </option>
              ))}
            </select>
          </label>

          <label className="block text-sm font-semibold text-stone-700">
            Role
            <select
              name="role"
              className="mt-2 w-full rounded-lg border border-amber-200/60 bg-white px-3 py-2 text-sm text-stone-900"
            >
              <option value="PRIMARY">Primary</option>
              <option value="MEMBER">Member</option>
            </select>
          </label>
        </div>

        <label className="block text-sm font-semibold text-stone-700">
          Relationship (optional)
          <input
            name="relationship"
            type="text"
            placeholder="Spouse, Parent, Guardian"
            className="mt-2 w-full rounded-lg border border-amber-200/60 bg-white px-3 py-2 text-sm text-stone-900"
          />
        </label>

        <button
          type="submit"
          className="inline-flex h-10 items-center justify-center rounded-full bg-teal-700 px-5 text-xs font-semibold uppercase tracking-[0.2em] text-white transition hover:bg-teal-800"
        >
          Add member
        </button>
      </form>

      <div className="rounded-2xl border border-amber-200/60 bg-white shadow-sm">
        <table className="w-full text-left text-sm">
          <thead className="border-b border-amber-200/60 bg-amber-50/40">
            <tr>
              <th className="px-4 py-3 font-semibold text-stone-700">Donor</th>
              <th className="px-4 py-3 font-semibold text-stone-700">Email</th>
              <th className="px-4 py-3 font-semibold text-stone-700">Role</th>
              <th className="px-4 py-3 font-semibold text-stone-700">
                Relationship
              </th>
            </tr>
          </thead>
          <tbody>
            {household.memberships.length ? (
              household.memberships.map((membership) => (
                <tr key={membership.id} className="border-b border-amber-100">
                  <td className="px-4 py-3 text-stone-600">
                    {membership.donor.displayName ??
                      membership.donor.primaryEmail ??
                      "Donor"}
                  </td>
                  <td className="px-4 py-3 text-stone-600">
                    {membership.donor.primaryEmail ?? "--"}
                  </td>
                  <td className="px-4 py-3 text-stone-600">
                    {membership.role}
                  </td>
                  <td className="px-4 py-3 text-stone-600">
                    {membership.relationship ?? "--"}
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td
                  className="px-4 py-6 text-center text-stone-500"
                  colSpan={4}
                >
                  No members yet.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
