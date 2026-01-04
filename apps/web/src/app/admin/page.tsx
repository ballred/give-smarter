import { auth } from "@clerk/nextjs/server";
import Link from "next/link";
import { redirect } from "next/navigation";

export default function AdminPage() {
  const { userId } = auth();

  if (!userId) {
    redirect("/sign-in");
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-zinc-50 px-6 py-16">
      <div className="w-full max-w-2xl rounded-3xl border border-zinc-200 bg-white p-10 shadow-sm">
        <h1 className="text-3xl font-semibold text-zinc-900">
          Admin console
        </h1>
        <p className="mt-3 text-zinc-600">
          Clerk authentication is wired. Next up: org setup, campaigns, and
          permissions.
        </p>
        <div className="mt-6">
          <Link
            className="inline-flex h-11 items-center justify-center rounded-full bg-zinc-900 px-5 text-sm font-semibold text-white transition hover:bg-zinc-800"
            href="/"
          >
            Back to home
          </Link>
        </div>
      </div>
    </div>
  );
}
