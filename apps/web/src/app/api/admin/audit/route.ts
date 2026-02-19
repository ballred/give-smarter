import { NextResponse } from "next/server";
import { auth } from "@/lib/admin-auth";
import { prisma } from "@/lib/db";
import { toCsv } from "@/lib/csv";

export const runtime = "nodejs";

export async function GET(request: Request) {
  const { userId } = await auth();

  if (!userId) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const url = new URL(request.url);
  const format = url.searchParams.get("format") ?? "json";

  const entries = await prisma.auditLogEntry.findMany({
    include: {
      actor: { select: { email: true, displayName: true } },
    },
    orderBy: { createdAt: "desc" },
    take: 500,
  });

  if (format === "csv") {
    const headers = [
      "created_at",
      "actor",
      "action",
      "target_type",
      "target_id",
      "ip_address",
      "user_agent",
      "before_data",
      "after_data",
    ];
    const rows = entries.map((entry) => [
      entry.createdAt.toISOString(),
      entry.actor?.displayName ?? entry.actor?.email ?? "",
      entry.action,
      entry.targetType,
      entry.targetId,
      entry.ipAddress ?? "",
      entry.userAgent ?? "",
      entry.beforeData ? JSON.stringify(entry.beforeData) : "",
      entry.afterData ? JSON.stringify(entry.afterData) : "",
    ]);

    return new NextResponse(toCsv(headers, rows), {
      headers: {
        "Content-Type": "text/csv",
        "Content-Disposition": "attachment; filename=audit-log.csv",
      },
    });
  }

  return NextResponse.json({ data: entries });
}
