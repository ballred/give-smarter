"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

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
  { label: "Sponsors", href: "/admin/sponsors" },
  { label: "Donations", href: "/admin/donations" },
  { label: "Volunteers", href: "/admin/volunteers" },
  { label: "Peer-to-Peer", href: "/admin/peer-to-peer" },
  { label: "Donors", href: "/admin/donors" },
  { label: "Households", href: "/admin/households" },
  { label: "Messaging", href: "/admin/messaging" },
  { label: "Integrations", href: "/admin/integrations" },
  { label: "Reports", href: "/admin/reports" },
  { label: "Audit log", href: "/admin/audit" },
];

export function AdminNav() {
  const pathname = usePathname();

  function isActive(href: string) {
    if (href === "/admin") {
      return pathname === href;
    }

    return pathname === href || pathname.startsWith(`${href}/`);
  }

  return (
    <aside className="w-64 border-r border-[var(--gs-nav-border)] bg-white px-6 py-8">
      <div className="mb-8 text-xs font-semibold uppercase tracking-[0.3em] text-stone-500">
        GiveSmarter
      </div>
      <nav className="space-y-1">
        {NAV_ITEMS.map((item) => {
          const active = isActive(item.href);

          return (
            <Link
              key={item.href}
              href={item.href}
              aria-current={active ? "page" : undefined}
              className={
                active
                  ? "block rounded-lg bg-teal-700 px-3 py-2 text-sm font-semibold text-white shadow-[0_8px_24px_rgba(15,118,110,0.22)]"
                  : "block rounded-lg px-3 py-2 text-sm font-semibold text-stone-700 transition hover:bg-amber-50"
              }
            >
              {item.label}
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}
