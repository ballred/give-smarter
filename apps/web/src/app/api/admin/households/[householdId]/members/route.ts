import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { prisma } from "@/lib/db";
import { logAuditEntry } from "@/lib/audit";

export const runtime = "nodejs";

type HouseholdMemberPayload = {
  donorId?: string;
  role?: "PRIMARY" | "MEMBER";
  relationship?: string;
};

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ householdId: string }> },
) {
  const { userId } = await auth();

  if (!userId) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const { householdId } = await params;

  const members = await prisma.householdMembership.findMany({
    where: { householdId },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json({ data: members });
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ householdId: string }> },
) {
  const { userId } = await auth();

  if (!userId) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const { householdId } = await params;

  let body: HouseholdMemberPayload;

  try {
    body = (await request.json()) as HouseholdMemberPayload;
  } catch {
    return NextResponse.json({ error: "invalid_json" }, { status: 400 });
  }

  if (!body.donorId) {
    return NextResponse.json({ error: "invalid_payload" }, { status: 400 });
  }

  const household = await prisma.household.findUnique({
    where: { id: householdId },
    select: { id: true, orgId: true },
  });

  if (!household) {
    return NextResponse.json({ error: "household_not_found" }, { status: 404 });
  }

  const beforeMembership = await prisma.householdMembership.findUnique({
    where: {
      householdId_donorId: {
        householdId,
        donorId: body.donorId,
      },
    },
  });

  const membership = await prisma.householdMembership.upsert({
    where: {
      householdId_donorId: {
        householdId,
        donorId: body.donorId,
      },
    },
    update: {
      role: body.role ?? "MEMBER",
      relationship: body.relationship ?? null,
    },
    create: {
      householdId,
      donorId: body.donorId,
      role: body.role ?? "MEMBER",
      relationship: body.relationship ?? null,
    },
  });

  await logAuditEntry({
    orgId: household.orgId,
    action: beforeMembership
      ? "household_membership.update"
      : "household_membership.create",
    targetType: "HouseholdMembership",
    targetId: membership.id,
    beforeData: beforeMembership ?? undefined,
    afterData: membership,
  });

  return NextResponse.json({ data: membership }, { status: 201 });
}
