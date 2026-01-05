import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { prisma } from "@/lib/db";

export const runtime = "nodejs";

type HouseholdUpdate = {
  name?: string;
};

export async function GET(
  _request: Request,
  { params }: { params: { householdId: string } },
) {
  const { userId } = auth();

  if (!userId) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const household = await prisma.household.findUnique({
    where: { id: params.householdId },
  });

  if (!household) {
    return NextResponse.json({ error: "not_found" }, { status: 404 });
  }

  return NextResponse.json({ data: household });
}

export async function PUT(
  request: Request,
  { params }: { params: { householdId: string } },
) {
  const { userId } = auth();

  if (!userId) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  let body: HouseholdUpdate;

  try {
    body = (await request.json()) as HouseholdUpdate;
  } catch {
    return NextResponse.json({ error: "invalid_json" }, { status: 400 });
  }

  const household = await prisma.household.update({
    where: { id: params.householdId },
    data: {
      name: body.name,
    },
  });

  return NextResponse.json({ data: household });
}

export async function DELETE(
  _request: Request,
  { params }: { params: { householdId: string } },
) {
  const { userId } = auth();

  if (!userId) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  await prisma.household.delete({
    where: { id: params.householdId },
  });

  return NextResponse.json({ ok: true });
}
