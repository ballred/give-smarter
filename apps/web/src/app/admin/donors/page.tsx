import Link from "next/link";
import { prisma } from "@/lib/db";

type SearchParams = {
  q?: string;
};

export default async function DonorsPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const query = searchParams.q?.trim() ?? "";
  const donors = await prisma.donor.findMany({
    where: query
      ? {
          OR: [
            { displayName: { contains: query, mode: "insensitive" } },
            { firstName: { contains: query, mode: "insensitive" } },
            { lastName: { contains: query, mode: "insensitive" } },
            { primaryEmail: { contains: query, mode: "insensitive" } },
            { primaryPhone: { contains: query, mode: "insensitive" } },
          ],
        }
      : undefined,
    include: { organization: { select: { publicName: true } } },
    orderBy: { createdAt: "desc" },
    take: query ? 50 : 25,
  });

  return (
    <div className="space-y-6">
      <header className="space-y-2">
        <h1 className="text-2xl font-semibold text-zinc-900">Donors</h1>
        <p className="text-sm text-zinc-600">
          Search and manage donor profiles across campaigns.
        </p>
      </header>

      <form className="flex flex-wrap items-center gap-3" method="get">
        <input
          name="q"
          defaultValue={query}
          placeholder="Search by name, email, or phone"
          className="h-11 flex-1 rounded-full border border-zinc-200 bg-white px-5 text-sm text-zinc-900"
        />
        <button
          type="submit"
          className="inline-flex h-11 items-center justify-center rounded-full bg-zinc-900 px-6 text-xs font-semibold uppercase tracking-[0.2em] text-white transition hover:bg-zinc-800"
        >
          Search
        </button>
      </form>

      <div className="rounded-2xl border border-zinc-200 bg-white shadow-sm">
        <table className="w-full text-left text-sm">
          <thead className="border-b border-zinc-200 bg-zinc-50">
            <tr>
              <th className="px-4 py-3 font-semibold text-zinc-700">Donor</th>
              <th className="px-4 py-3 font-semibold text-zinc-700">Org</th>
              <th className="px-4 py-3 font-semibold text-zinc-700">Email</th>
              <th className="px-4 py-3 font-semibold text-zinc-700">Phone</th>
              <th className="px-4 py-3 font-semibold text-zinc-700">Created</th>
            </tr>
          </thead>
          <tbody>
            {donors.length ? (
              donors.map((donor) => (
                <tr key={donor.id} className="border-b border-zinc-100">
                  <td className="px-4 py-3 font-semibold text-zinc-900">
                    <Link
                      className="text-zinc-900 hover:text-zinc-700"
                      href={`/admin/donors/${donor.id}`}
                    >
                      {donor.displayName ??
                        [donor.firstName, donor.lastName]
                          .filter(Boolean)
                          .join(" ") ||
                        "Unnamed donor"}
                    </Link>
                  </td>
                  <td className="px-4 py-3 text-zinc-600">
                    {donor.organization.publicName}
                  </td>
                  <td className="px-4 py-3 text-zinc-600">
                    {donor.primaryEmail ?? "—"}
                  </td>
                  <td className="px-4 py-3 text-zinc-600">
                    {donor.primaryPhone ?? "—"}
                  </td>
                  <td className="px-4 py-3 text-zinc-600">
                    {new Date(donor.createdAt).toLocaleDateString()}
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td className="px-4 py-6 text-center text-zinc-500" colSpan={5}>
                  {query ? "No donors found." : "Search to begin."}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
