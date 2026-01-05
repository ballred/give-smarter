import Link from "next/link";

const NAV_ITEMS = [
  { label: "Dashboard", href: "/admin" },
  { label: "Campaigns", href: "/admin/campaigns" },
  { label: "Ticketing", href: "/admin/ticketing" },
  { label: "Auctions", href: "/admin/auctions" },
  { label: "Live Giving", href: "/admin/live-giving" },
  { label: "Check-in", href: "/admin/check-in" },
  { label: "Raffles", href: "/admin/raffles" },
  { label: "Voting", href: "/admin/voting" },
  { label: "Store", href: "/admin/store" },
  { label: "Donations", href: "/admin/donations" },
  { label: "Donors", href: "/admin/donors" },
  { label: "Messaging", href: "/admin/messaging" },
  { label: "Integrations", href: "/admin/integrations" },
  { label: "Reports", href: "/admin/reports" },
];

export function AdminNav() {
  return (
    <aside className="w-64 border-r border-zinc-200 bg-white px-6 py-8">
      <div className="mb-8 text-xs font-semibold uppercase tracking-[0.3em] text-zinc-500">
        GiveSmarter
      </div>
      <nav className="space-y-1">
        {NAV_ITEMS.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className="block rounded-lg px-3 py-2 text-sm font-semibold text-zinc-700 transition hover:bg-zinc-100"
          >
            {item.label}
          </Link>
        ))}
      </nav>
    </aside>
  );
}
