import { NextResponse } from "next/server";
import { auth } from "@/lib/admin-auth";
import { prisma } from "@/lib/db";
import { logAuditEntry } from "@/lib/audit";

export const runtime = "nodejs";

type ProcurementPayload = {
  campaignId?: string | null;
  donorName?: string;
  donorEmail?: string | null;
  donorPhone?: string | null;
  itemTitle?: string | null;
  itemDescription?: string | null;
  fmvAmount?: number;
  fmvAmountCents?: number;
  restrictions?: string | null;
  notes?: string | null;
};

export async function GET() {
  const { userId } = await auth();

  if (!userId) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const submissions = await prisma.procurementSubmission.findMany({
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json({ data: submissions });
}

export async function POST(request: Request) {
  const { userId } = await auth();

  if (!userId) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  let body: ProcurementPayload;

  try {
    body = (await request.json()) as ProcurementPayload;
  } catch {
    return NextResponse.json({ error: "invalid_json" }, { status: 400 });
  }

  if (!body.donorName) {
    return NextResponse.json({ error: "invalid_donor" }, { status: 400 });
  }

  const orgSource = body.campaignId
    ? await prisma.campaign.findUnique({
        where: { id: body.campaignId },
        select: { orgId: true },
      })
    : await prisma.organization.findFirst({ select: { id: true } });

  if (!orgSource) {
    return NextResponse.json({ error: "org_not_found" }, { status: 404 });
  }

  const orgId = "orgId" in orgSource ? orgSource.orgId : orgSource.id;
  const fmvCents =
    typeof body.fmvAmountCents === "number"
      ? body.fmvAmountCents
      : typeof body.fmvAmount === "number"
        ? Math.round(body.fmvAmount * 100)
        : null;

  const donor = await prisma.procurementDonor.create({
    data: {
      orgId,
      name: body.donorName,
      email: body.donorEmail ?? null,
      phone: body.donorPhone ?? null,
    },
  });

  const submission = await prisma.procurementSubmission.create({
    data: {
      orgId,
      campaignId: body.campaignId ?? null,
      procurementDonorId: donor.id,
      itemTitle: body.itemTitle ?? null,
      itemDescription: body.itemDescription ?? null,
      fmvAmount: fmvCents !== null && fmvCents > 0 ? fmvCents : null,
      restrictions: body.restrictions ?? null,
      notes: body.notes ?? null,
    },
  });

  await logAuditEntry({
    orgId,
    action: "procurement_submission.create",
    targetType: "ProcurementSubmission",
    targetId: submission.id,
    afterData: submission,
  });

  return NextResponse.json({ data: submission }, { status: 201 });
}
