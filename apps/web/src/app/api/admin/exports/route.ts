import { NextResponse } from "next/server";
import { auth } from "@/lib/admin-auth";

export const runtime = "nodejs";

export async function POST() {
  const { userId } = await auth();

  if (!userId) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  return NextResponse.json({ status: "queued" }, { status: 202 });
}
