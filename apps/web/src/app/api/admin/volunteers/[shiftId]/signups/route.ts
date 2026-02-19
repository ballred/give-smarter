import { NextResponse } from "next/server";
import { auth } from "@/lib/admin-auth";
import { prisma } from "@/lib/db";
import { toCsv } from "@/lib/csv";

export const runtime = "nodejs";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ shiftId: string }> },
) {
  const { userId } = await auth();

  if (!userId) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const { shiftId } = await params;
  const url = new URL(request.url);
  const format = url.searchParams.get("format") ?? "csv";

  const shift = await prisma.volunteerShift.findUnique({
    where: { id: shiftId },
    include: {
      campaign: { select: { name: true } },
      signups: {
        include: { donor: { select: { primaryEmail: true, primaryPhone: true } } },
        orderBy: { createdAt: "desc" },
      },
    },
  });

  if (!shift) {
    return NextResponse.json({ error: "not_found" }, { status: 404 });
  }

  if (format !== "csv") {
    return NextResponse.json({ data: shift.signups });
  }

  const headers = [
    "shift",
    "campaign",
    "name",
    "email",
    "phone",
    "status",
    "created_at",
  ];

  const rows = shift.signups.map((signup) => [
    shift.name,
    shift.campaign?.name ?? "",
    signup.name,
    signup.email ?? signup.donor?.primaryEmail ?? "",
    signup.phone ?? signup.donor?.primaryPhone ?? "",
    signup.status,
    signup.createdAt.toISOString(),
  ]);

  return new NextResponse(toCsv(headers, rows), {
    headers: {
      "Content-Type": "text/csv",
      "Content-Disposition": `attachment; filename=volunteer-signups-${shift.id}.csv`,
    },
  });
}
