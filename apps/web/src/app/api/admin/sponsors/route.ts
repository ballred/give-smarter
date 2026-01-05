import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { prisma } from "@/lib/db";

export const runtime = "nodejs";

type SponsorPayload = {
  orgId?: string;
  name?: string;
  level?: string;
  logoUrl?: string;
  websiteUrl?: string;
};

export async function GET() {
  const { userId } = auth();

  if (!userId) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const sponsors = await prisma.sponsor.findMany({
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json({ data: sponsors });
}

export async function POST(request: Request) {
  const { userId } = auth();

  if (!userId) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  let body: SponsorPayload;

  try {
    body = (await request.json()) as SponsorPayload;
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

  const sponsor = await prisma.sponsor.create({
    data: {
      orgId: body.orgId,
      name: body.name,
      level: body.level ?? null,
      logoUrl: body.logoUrl ?? null,
      websiteUrl: body.websiteUrl ?? null,
    },
  });

  return NextResponse.json({ data: sponsor }, { status: 201 });
}
