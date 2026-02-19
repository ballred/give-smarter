import Link from "next/link";

const MODULES = [
  {
    title: "Fundraisers",
    description: "Individual fundraiser pages and goals.",
    href: "/admin/peer-to-peer/fundraisers",
  },
  {
    title: "Teams",
    description: "Group fundraising teams and rollups.",
    href: "/admin/peer-to-peer/teams",
  },
  {
    title: "Classrooms",
    description: "Classroom fundraising for school campaigns.",
    href: "/admin/peer-to-peer/classrooms",
  },
  {
    title: "Exports",
    description: "Download classroom totals for prizes.",
    href: "/admin/peer-to-peer/exports",
  },
];

export default function PeerToPeerAdminPage() {
  return (
    <div className="space-y-6">
      <header className="space-y-2">
        <h1 className="text-2xl font-semibold text-stone-900">Peer-to-peer</h1>
        <p className="text-sm text-stone-600">
          Manage fundraisers, teams, and classroom leaderboards.
        </p>
      </header>

      <div className="grid gap-6 md:grid-cols-3">
        {MODULES.map((module) => (
          <Link
            key={module.href}
            href={module.href}
            className="rounded-2xl border border-amber-200/60 bg-white p-6 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
          >
            <h2 className="text-lg font-semibold text-stone-900">
              {module.title}
            </h2>
            <p className="mt-2 text-sm text-stone-600">{module.description}</p>
          </Link>
        ))}
      </div>
    </div>
  );
}
