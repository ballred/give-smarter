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

  const attendees = await prisma.attendee.findMany({
    include: {
      campaign: { select: { name: true } },
      ticketType: { select: { name: true } },
      checkins: { take: 1, orderBy: { checkedInAt: "desc" } },
    },
    orderBy: { createdAt: "desc" },
  });

  if (format === "csv") {
    const headers = [
      "campaign",
      "ticket_type",
      "first_name",
      "last_name",
      "email",
      "phone",
      "status",
      "checked_in_at",
    ];
    const rows = attendees.map((attendee) => [
      attendee.campaign?.name ?? "",
      attendee.ticketType?.name ?? "",
      attendee.firstName ?? "",
      attendee.lastName ?? "",
      attendee.email ?? "",
      attendee.phone ?? "",
      attendee.status,
      attendee.checkins[0]?.checkedInAt?.toISOString() ?? "",
    ]);

    return new NextResponse(toCsv(headers, rows), {
      headers: {
        "Content-Type": "text/csv",
        "Content-Disposition": "attachment; filename=attendance-report.csv",
      },
    });
  }

  return NextResponse.json({ data: attendees });
}
