import Link from "next/link";

const NAV_ITEMS = [
  { label: "Overview", href: "/portal" },
  { label: "Tickets", href: "/portal/tickets" },
  { label: "Bids", href: "/portal/bids" },
  { label: "Receipts", href: "/portal/receipts" },
  { label: "Recurring", href: "/portal/recurring" },
  { label: "Profile", href: "/portal/profile" },
];

export function PortalNav() {
  return (
    <div className="flex flex-wrap items-center gap-3">
      {NAV_ITEMS.map((item) => (
        <Link
          key={item.href}
          href={item.href}
          className="inline-flex items-center rounded-full border border-amber-200/60 bg-white px-4 py-2 text-xs font-semibold uppercase tracking-[0.2em] text-stone-600 transition hover:border-amber-300 hover:text-stone-900"
        >
          {item.label}
        </Link>
      ))}
    </div>
  );
}
