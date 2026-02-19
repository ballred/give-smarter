import { NextResponse } from "next/server";
import { auth } from "@/lib/admin-auth";
import { prisma } from "@/lib/db";
import { logAuditEntry } from "@/lib/audit";

export const runtime = "nodejs";

type PaddleRaiseUpdatePayload = {
  label?: string;
  amount?: number;
  matchSponsorName?: string | null;
  sortOrder?: number;
  isActive?: boolean;
};

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ levelId: string }> },
) {
  const { userId } = await auth();

  if (!userId) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const { levelId } = await params;

  const level = await prisma.paddleRaiseLevel.findUnique({
    where: { id: levelId },
  });

  if (!level) {
    return NextResponse.json({ error: "not_found" }, { status: 404 });
  }

  return NextResponse.json({ data: level });
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ levelId: string }> },
) {
  const { userId } = await auth();

  if (!userId) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const { levelId } = await params;

  let body: PaddleRaiseUpdatePayload;

  try {
    body = (await request.json()) as PaddleRaiseUpdatePayload;
  } catch {
    return NextResponse.json({ error: "invalid_json" }, { status: 400 });
  }

  const beforeLevel = await prisma.paddleRaiseLevel.findUnique({
    where: { id: levelId },
  });

  if (!beforeLevel) {
    return NextResponse.json({ error: "not_found" }, { status: 404 });
  }

  const data: Record<string, unknown> = {};

  if (body.label !== undefined) data.label = body.label;
  if (body.amount !== undefined) {
    if (!Number.isFinite(body.amount) || body.amount < 0) {
      return NextResponse.json({ error: "invalid_amount" }, { status: 400 });
    }
    data.amount = Math.round(body.amount * 100);
  }
  if (body.matchSponsorName !== undefined) {
    data.matchSponsorName = body.matchSponsorName;
  }
  if (body.sortOrder !== undefined) data.sortOrder = body.sortOrder;
  if (body.isActive !== undefined) data.isActive = body.isActive;

  const level = await prisma.paddleRaiseLevel.update({
    where: { id: levelId },
    data,
  });

  await logAuditEntry({
    orgId: level.orgId,
    action: "paddle_raise_level.update",
    targetType: "PaddleRaiseLevel",
    targetId: levelId,
    beforeData: beforeLevel,
    afterData: level,
  });

  return NextResponse.json({ data: level });
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ levelId: string }> },
) {
  const { userId } = await auth();

  if (!userId) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const { levelId } = await params;

  const level = await prisma.paddleRaiseLevel.findUnique({
    where: { id: levelId },
  });

  if (!level) {
    return NextResponse.json({ error: "not_found" }, { status: 404 });
  }

  await prisma.paddleRaiseLevel.delete({ where: { id: levelId } });

  await logAuditEntry({
    orgId: level.orgId,
    action: "paddle_raise_level.delete",
    targetType: "PaddleRaiseLevel",
    targetId: levelId,
    beforeData: level,
  });

  return NextResponse.json({ ok: true });
}
