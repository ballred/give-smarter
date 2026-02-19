"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const NAV_ITEMS = [
  { label: "Overview", href: "/portal" },
  { label: "Tickets", href: "/portal/tickets" },
  { label: "Bids", href: "/portal/bids" },
  { label: "Receipts", href: "/portal/receipts" },
  { label: "Recurring", href: "/portal/recurring" },
  { label: "Profile", href: "/portal/profile" },
];

export function PortalNav() {
  const pathname = usePathname();

  function isActive(href: string) {
    if (href === "/portal") {
      return pathname === href;
    }

    return pathname === href || pathname.startsWith(`${href}/`);
  }

  return (
    <div className="flex flex-wrap items-center gap-3">
      {NAV_ITEMS.map((item) => {
        const active = isActive(item.href);

        return (
          <Link
            key={item.href}
            href={item.href}
            aria-current={active ? "page" : undefined}
            className={
              active
                ? "inline-flex items-center rounded-full border border-teal-700 bg-teal-700 px-4 py-2 text-xs font-semibold uppercase tracking-[0.2em] text-white shadow-[0_8px_24px_rgba(15,118,110,0.22)]"
                : "inline-flex items-center rounded-full border border-amber-200/60 bg-white px-4 py-2 text-xs font-semibold uppercase tracking-[0.2em] text-stone-600 transition hover:border-amber-300 hover:text-stone-900"
            }
          >
            {item.label}
          </Link>
        );
      })}
    </div>
  );
}
