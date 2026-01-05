import type { ReactNode } from "react";
import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { AdminNav } from "./_components/AdminNav";

export default function AdminLayout({ children }: { children: ReactNode }) {
  const { userId } = auth();

  if (!userId) {
    redirect("/sign-in");
  }

  return (
    <div className="min-h-screen bg-zinc-50 text-zinc-900">
      <div className="flex min-h-screen">
        <AdminNav />
        <main className="flex-1 px-8 py-10">{children}</main>
      </div>
    </div>
  );
}
