import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { prisma } from "@/lib/db";

export const runtime = "nodejs";

type HouseholdMemberPayload = {
  donorId?: string;
  role?: "PRIMARY" | "MEMBER";
  relationship?: string;
};

export async function GET(
  _request: Request,
  { params }: { params: { householdId: string } },
) {
  const { userId } = auth();

  if (!userId) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const members = await prisma.householdMembership.findMany({
    where: { householdId: params.householdId },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json({ data: members });
}

export async function POST(
  request: Request,
  { params }: { params: { householdId: string } },
) {
  const { userId } = auth();

  if (!userId) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

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
    where: { id: params.householdId },
    select: { id: true },
  });

  if (!household) {
    return NextResponse.json({ error: "household_not_found" }, { status: 404 });
  }

  const membership = await prisma.householdMembership.upsert({
    where: {
      householdId_donorId: {
        householdId: params.householdId,
        donorId: body.donorId,
      },
    },
    update: {
      role: body.role ?? "MEMBER",
      relationship: body.relationship ?? null,
    },
    create: {
      householdId: params.householdId,
      donorId: body.donorId,
      role: body.role ?? "MEMBER",
      relationship: body.relationship ?? null,
    },
  });

  return NextResponse.json({ data: membership }, { status: 201 });
}
