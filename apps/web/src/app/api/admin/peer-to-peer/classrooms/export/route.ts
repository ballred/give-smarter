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
  const campaignId = url.searchParams.get("campaignId");
  const format = url.searchParams.get("format") ?? "csv";

  if (!campaignId) {
    return NextResponse.json({ error: "campaign_required" }, { status: 400 });
  }

  const [classrooms, attributions] = await Promise.all([
    prisma.peerFundraisingClassroom.findMany({
      where: { campaignId },
      orderBy: { name: "asc" },
    }),
    prisma.peerFundraisingAttribution.findMany({
      where: { campaignId, classroomId: { not: null } },
      include: { orderLineItem: { select: { totalAmount: true } } },
    }),
  ]);

  const totals = new Map<string, { total: number; count: number }>();
  for (const attribution of attributions) {
    if (!attribution.classroomId) continue;
    const current = totals.get(attribution.classroomId) ?? {
      total: 0,
      count: 0,
    };
    totals.set(attribution.classroomId, {
      total: current.total + attribution.orderLineItem.totalAmount,
      count: current.count + 1,
    });
  }

  if (format !== "csv") {
    const data = classrooms.map((classroom) => ({
      id: classroom.id,
      name: classroom.name,
      grade: classroom.grade,
      teacherName: classroom.teacherName,
      goalAmount: classroom.goalAmount,
      totals: totals.get(classroom.id) ?? { total: 0, count: 0 },
    }));
    return NextResponse.json({ data });
  }

  const headers = [
    "classroom_name",
    "grade",
    "teacher_name",
    "goal_amount_cents",
    "total_raised_cents",
    "donations_count",
  ];
  const rows = classrooms.map((classroom) => {
    const totalsEntry = totals.get(classroom.id) ?? { total: 0, count: 0 };
    return [
      classroom.name,
      classroom.grade ?? "",
      classroom.teacherName ?? "",
      classroom.goalAmount ?? 0,
      totalsEntry.total,
      totalsEntry.count,
    ];
  });

  return new NextResponse(toCsv(headers, rows), {
    headers: {
      "Content-Type": "text/csv",
      "Content-Disposition": "attachment; filename=classroom-fundraising.csv",
    },
  });
}
