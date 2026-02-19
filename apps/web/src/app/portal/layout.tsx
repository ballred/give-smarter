import type { ReactNode } from "react";
import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { PortalNav } from "./portal-nav";

export default async function PortalLayout({ children }: { children: ReactNode }) {
  const { userId } = await auth();

  if (!userId) {
    redirect("/sign-in");
  }

  return (
    <div className="min-h-screen bg-[var(--gs-surface)] text-stone-900">
      <div className="mx-auto w-full max-w-6xl px-6 py-10">
        <PortalNav />
        <main className="mt-8">{children}</main>
      </div>
    </div>
  );
}
