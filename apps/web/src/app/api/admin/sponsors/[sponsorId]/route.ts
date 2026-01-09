import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { prisma } from "@/lib/db";
import { logAuditEntry } from "@/lib/audit";

export const runtime = "nodejs";

type SponsorUpdate = {
  name?: string;
  level?: string;
  logoUrl?: string;
  websiteUrl?: string;
};

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ sponsorId: string }> },
) {
  const { userId } = await auth();

  if (!userId) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const { sponsorId } = await params;

  const sponsor = await prisma.sponsor.findUnique({
    where: { id: sponsorId },
  });

  if (!sponsor) {
    return NextResponse.json({ error: "not_found" }, { status: 404 });
  }

  return NextResponse.json({ data: sponsor });
}

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ sponsorId: string }> },
) {
  const { userId } = await auth();

  if (!userId) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const { sponsorId } = await params;

  let body: SponsorUpdate;

  try {
    body = (await request.json()) as SponsorUpdate;
  } catch {
    return NextResponse.json({ error: "invalid_json" }, { status: 400 });
  }

  const beforeSponsor = await prisma.sponsor.findUnique({
    where: { id: sponsorId },
  });

  if (!beforeSponsor) {
    return NextResponse.json({ error: "not_found" }, { status: 404 });
  }

  const sponsor = await prisma.sponsor.update({
    where: { id: sponsorId },
    data: {
      name: body.name,
      level: body.level ?? undefined,
      logoUrl: body.logoUrl ?? undefined,
      websiteUrl: body.websiteUrl ?? undefined,
    },
  });

  await logAuditEntry({
    orgId: sponsor.orgId,
    action: "sponsor.update",
    targetType: "Sponsor",
    targetId: sponsorId,
    beforeData: beforeSponsor,
    afterData: sponsor,
  });

  return NextResponse.json({ data: sponsor });
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ sponsorId: string }> },
) {
  const { userId } = await auth();

  if (!userId) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const { sponsorId } = await params;

  const sponsor = await prisma.sponsor.findUnique({
    where: { id: sponsorId },
  });

  if (!sponsor) {
    return NextResponse.json({ error: "not_found" }, { status: 404 });
  }

  await prisma.sponsor.delete({
    where: { id: sponsorId },
  });

  await logAuditEntry({
    orgId: sponsor.orgId,
    action: "sponsor.delete",
    targetType: "Sponsor",
    targetId: sponsorId,
    beforeData: sponsor,
  });

  return NextResponse.json({ ok: true });
}
