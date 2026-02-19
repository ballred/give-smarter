import { NextResponse } from "next/server";
import { auth } from "@/lib/admin-auth";
import { prisma } from "@/lib/db";
import { logAuditEntry } from "@/lib/audit";

export const runtime = "nodejs";

type DonorUpdatePayload = {
  displayName?: string | null;
  firstName?: string | null;
  lastName?: string | null;
  preferredName?: string | null;
  primaryEmail?: string | null;
  primaryPhone?: string | null;
};

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ donorId: string }> },
) {
  const { userId } = await auth();

  if (!userId) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const { donorId } = await params;

  const donor = await prisma.donor.findUnique({
    where: { id: donorId },
  });

  if (!donor) {
    return NextResponse.json({ error: "not_found" }, { status: 404 });
  }

  return NextResponse.json({ data: donor });
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ donorId: string }> },
) {
  const { userId } = await auth();

  if (!userId) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const { donorId } = await params;

  let body: DonorUpdatePayload;

  try {
    body = (await request.json()) as DonorUpdatePayload;
  } catch {
    return NextResponse.json({ error: "invalid_json" }, { status: 400 });
  }

  const beforeDonor = await prisma.donor.findUnique({
    where: { id: donorId },
  });

  if (!beforeDonor) {
    return NextResponse.json({ error: "not_found" }, { status: 404 });
  }

  const data: Record<string, unknown> = {};

  if (body.displayName !== undefined) data.displayName = body.displayName;
  if (body.firstName !== undefined) data.firstName = body.firstName;
  if (body.lastName !== undefined) data.lastName = body.lastName;
  if (body.preferredName !== undefined) data.preferredName = body.preferredName;
  if (body.primaryEmail !== undefined) data.primaryEmail = body.primaryEmail;
  if (body.primaryPhone !== undefined) data.primaryPhone = body.primaryPhone;

  const donor = await prisma.donor.update({
    where: { id: donorId },
    data,
  });

  await logAuditEntry({
    orgId: donor.orgId,
    action: "donor.update",
    targetType: "Donor",
    targetId: donor.id,
    beforeData: beforeDonor,
    afterData: donor,
  });

  return NextResponse.json({ data: donor });
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ donorId: string }> },
) {
  const { userId } = await auth();

  if (!userId) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const { donorId } = await params;

  const donor = await prisma.donor.findUnique({
    where: { id: donorId },
  });

  if (!donor) {
    return NextResponse.json({ error: "not_found" }, { status: 404 });
  }

  await prisma.donor.delete({
    where: { id: donorId },
  });

  await logAuditEntry({
    orgId: donor.orgId,
    action: "donor.delete",
    targetType: "Donor",
    targetId: donorId,
    beforeData: donor,
  });

  return NextResponse.json({ ok: true });
}
