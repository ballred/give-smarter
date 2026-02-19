import { NextResponse } from "next/server";
import { auth } from "@/lib/admin-auth";
import { prisma } from "@/lib/db";
import { logAuditEntry } from "@/lib/audit";

export const runtime = "nodejs";

type HouseholdUpdate = {
  name?: string;
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

  const household = await prisma.household.findUnique({
    where: { id: householdId },
  });

  if (!household) {
    return NextResponse.json({ error: "not_found" }, { status: 404 });
  }

  return NextResponse.json({ data: household });
}

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ householdId: string }> },
) {
  const { userId } = await auth();

  if (!userId) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const { householdId } = await params;

  let body: HouseholdUpdate;

  try {
    body = (await request.json()) as HouseholdUpdate;
  } catch {
    return NextResponse.json({ error: "invalid_json" }, { status: 400 });
  }

  const beforeHousehold = await prisma.household.findUnique({
    where: { id: householdId },
  });

  if (!beforeHousehold) {
    return NextResponse.json({ error: "not_found" }, { status: 404 });
  }

  const household = await prisma.household.update({
    where: { id: householdId },
    data: {
      name: body.name,
    },
  });

  await logAuditEntry({
    orgId: household.orgId,
    action: "household.update",
    targetType: "Household",
    targetId: householdId,
    beforeData: beforeHousehold,
    afterData: household,
  });

  return NextResponse.json({ data: household });
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ householdId: string }> },
) {
  const { userId } = await auth();

  if (!userId) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const { householdId } = await params;

  const household = await prisma.household.findUnique({
    where: { id: householdId },
  });

  if (!household) {
    return NextResponse.json({ error: "not_found" }, { status: 404 });
  }

  await prisma.household.delete({
    where: { id: householdId },
  });

  await logAuditEntry({
    orgId: household.orgId,
    action: "household.delete",
    targetType: "Household",
    targetId: householdId,
    beforeData: household,
  });

  return NextResponse.json({ ok: true });
}
