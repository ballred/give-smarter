import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { prisma } from "@/lib/db";

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
  { params }: { params: { donorId: string } },
) {
  const { userId } = auth();

  if (!userId) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const donor = await prisma.donor.findUnique({
    where: { id: params.donorId },
  });

  if (!donor) {
    return NextResponse.json({ error: "not_found" }, { status: 404 });
  }

  return NextResponse.json({ data: donor });
}

export async function PATCH(
  request: Request,
  { params }: { params: { donorId: string } },
) {
  const { userId } = auth();

  if (!userId) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  let body: DonorUpdatePayload;

  try {
    body = (await request.json()) as DonorUpdatePayload;
  } catch {
    return NextResponse.json({ error: "invalid_json" }, { status: 400 });
  }

  const data: Record<string, unknown> = {};

  if (body.displayName !== undefined) data.displayName = body.displayName;
  if (body.firstName !== undefined) data.firstName = body.firstName;
  if (body.lastName !== undefined) data.lastName = body.lastName;
  if (body.preferredName !== undefined) data.preferredName = body.preferredName;
  if (body.primaryEmail !== undefined) data.primaryEmail = body.primaryEmail;
  if (body.primaryPhone !== undefined) data.primaryPhone = body.primaryPhone;

  const donor = await prisma.donor.update({
    where: { id: params.donorId },
    data,
  });

  return NextResponse.json({ data: donor });
}

export async function DELETE(
  _request: Request,
  { params }: { params: { donorId: string } },
) {
  const { userId } = auth();

  if (!userId) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  await prisma.donor.delete({
    where: { id: params.donorId },
  });

  return NextResponse.json({ ok: true });
}
