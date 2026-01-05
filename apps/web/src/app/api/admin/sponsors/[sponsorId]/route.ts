import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { prisma } from "@/lib/db";

export const runtime = "nodejs";

type SponsorUpdate = {
  name?: string;
  level?: string;
  logoUrl?: string;
  websiteUrl?: string;
};

export async function GET(
  _request: Request,
  { params }: { params: { sponsorId: string } },
) {
  const { userId } = auth();

  if (!userId) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const sponsor = await prisma.sponsor.findUnique({
    where: { id: params.sponsorId },
  });

  if (!sponsor) {
    return NextResponse.json({ error: "not_found" }, { status: 404 });
  }

  return NextResponse.json({ data: sponsor });
}

export async function PUT(
  request: Request,
  { params }: { params: { sponsorId: string } },
) {
  const { userId } = auth();

  if (!userId) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  let body: SponsorUpdate;

  try {
    body = (await request.json()) as SponsorUpdate;
  } catch {
    return NextResponse.json({ error: "invalid_json" }, { status: 400 });
  }

  const sponsor = await prisma.sponsor.update({
    where: { id: params.sponsorId },
    data: {
      name: body.name,
      level: body.level ?? undefined,
      logoUrl: body.logoUrl ?? undefined,
      websiteUrl: body.websiteUrl ?? undefined,
    },
  });

  return NextResponse.json({ data: sponsor });
}

export async function DELETE(
  _request: Request,
  { params }: { params: { sponsorId: string } },
) {
  const { userId } = auth();

  if (!userId) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  await prisma.sponsor.delete({
    where: { id: params.sponsorId },
  });

  return NextResponse.json({ ok: true });
}
