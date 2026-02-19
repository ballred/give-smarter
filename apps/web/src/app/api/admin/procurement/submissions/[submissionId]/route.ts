import { NextResponse } from "next/server";
import { auth } from "@/lib/admin-auth";
import { prisma } from "@/lib/db";
import { logAuditEntry } from "@/lib/audit";

export const runtime = "nodejs";

type ProcurementUpdatePayload = {
  status?: "PLEDGED" | "RECEIVED" | "CATALOGED" | "PUBLISHED" | "FULFILLED";
  itemTitle?: string | null;
  itemDescription?: string | null;
  fmvAmount?: number;
  fmvAmountCents?: number;
  restrictions?: string | null;
  notes?: string | null;
};

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ submissionId: string }> },
) {
  const { userId } = await auth();

  if (!userId) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const { submissionId } = await params;

  const submission = await prisma.procurementSubmission.findUnique({
    where: { id: submissionId },
  });

  if (!submission) {
    return NextResponse.json({ error: "not_found" }, { status: 404 });
  }

  return NextResponse.json({ data: submission });
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ submissionId: string }> },
) {
  const { userId } = await auth();

  if (!userId) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const { submissionId } = await params;

  let body: ProcurementUpdatePayload;

  try {
    body = (await request.json()) as ProcurementUpdatePayload;
  } catch {
    return NextResponse.json({ error: "invalid_json" }, { status: 400 });
  }

  const beforeSubmission = await prisma.procurementSubmission.findUnique({
    where: { id: submissionId },
  });

  if (!beforeSubmission) {
    return NextResponse.json({ error: "not_found" }, { status: 404 });
  }

  const data: Record<string, unknown> = {};

  if (body.status !== undefined) data.status = body.status;
  if (body.itemTitle !== undefined) data.itemTitle = body.itemTitle;
  if (body.itemDescription !== undefined) data.itemDescription = body.itemDescription;
  if (body.restrictions !== undefined) data.restrictions = body.restrictions;
  if (body.notes !== undefined) data.notes = body.notes;
  if (body.fmvAmount !== undefined || body.fmvAmountCents !== undefined) {
    const cents =
      typeof body.fmvAmountCents === "number"
        ? body.fmvAmountCents
        : typeof body.fmvAmount === "number"
          ? Math.round(body.fmvAmount * 100)
          : null;
    data.fmvAmount = cents !== null && cents > 0 ? cents : null;
  }

  const submission = await prisma.procurementSubmission.update({
    where: { id: submissionId },
    data,
  });

  await logAuditEntry({
    orgId: submission.orgId,
    action: "procurement_submission.update",
    targetType: "ProcurementSubmission",
    targetId: submissionId,
    beforeData: beforeSubmission,
    afterData: submission,
  });

  return NextResponse.json({ data: submission });
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ submissionId: string }> },
) {
  const { userId } = await auth();

  if (!userId) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const { submissionId } = await params;

  const submission = await prisma.procurementSubmission.findUnique({
    where: { id: submissionId },
  });

  if (!submission) {
    return NextResponse.json({ error: "not_found" }, { status: 404 });
  }

  await prisma.procurementSubmission.delete({
    where: { id: submissionId },
  });

  await logAuditEntry({
    orgId: submission.orgId,
    action: "procurement_submission.delete",
    targetType: "ProcurementSubmission",
    targetId: submissionId,
    beforeData: submission,
  });

  return NextResponse.json({ ok: true });
}
