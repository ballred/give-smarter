import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { prisma } from "@/lib/db";
import { logAuditEntry } from "@/lib/audit";

export const runtime = "nodejs";

type HouseholdPayload = {
  orgId?: string;
  name?: string;
};

export async function GET() {
  const { userId } = await auth();

  if (!userId) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const households = await prisma.household.findMany({
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json({ data: households });
}

export async function POST(request: Request) {
  const { userId } = await auth();

  if (!userId) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  let body: HouseholdPayload;

  try {
    body = (await request.json()) as HouseholdPayload;
  } catch {
    return NextResponse.json({ error: "invalid_json" }, { status: 400 });
  }

  if (!body.orgId || !body.name) {
    return NextResponse.json({ error: "invalid_payload" }, { status: 400 });
  }

  const organization = await prisma.organization.findUnique({
    where: { id: body.orgId },
    select: { id: true },
  });

  if (!organization) {
    return NextResponse.json({ error: "org_not_found" }, { status: 404 });
  }

  const household = await prisma.household.create({
    data: {
      orgId: body.orgId,
      name: body.name,
    },
  });

  await logAuditEntry({
    orgId: body.orgId,
    action: "household.create",
    targetType: "Household",
    targetId: household.id,
    afterData: household,
  });

  return NextResponse.json({ data: household }, { status: 201 });
}
