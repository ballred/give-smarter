import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { prisma } from "@/lib/db";

export const runtime = "nodejs";

const ROUTE_STATUSES = new Set(["ACTIVE", "INACTIVE"]);

type KeywordRouteUpdatePayload = {
  keyword?: string;
  campaignId?: string | null;
  replyMessage?: string | null;
  status?: string;
};

function normalizeKeyword(value: string) {
  return value.trim().toUpperCase().replace(/\s+/g, "");
}

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ routeId: string }> },
) {
  const { userId } = await auth();

  if (!userId) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const { routeId } = await params;

  const route = await prisma.keywordRoute.findUnique({
    where: { id: routeId },
  });

  if (!route) {
    return NextResponse.json({ error: "not_found" }, { status: 404 });
  }

  return NextResponse.json({ data: route });
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ routeId: string }> },
) {
  const { userId } = await auth();

  if (!userId) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const { routeId } = await params;

  let body: KeywordRouteUpdatePayload;

  try {
    body = (await request.json()) as KeywordRouteUpdatePayload;
  } catch {
    return NextResponse.json({ error: "invalid_json" }, { status: 400 });
  }

  if (body.status && !ROUTE_STATUSES.has(body.status)) {
    return NextResponse.json({ error: "invalid_status" }, { status: 400 });
  }

  const existing = await prisma.keywordRoute.findUnique({
    where: { id: routeId },
    select: { orgId: true },
  });

  if (!existing) {
    return NextResponse.json({ error: "not_found" }, { status: 404 });
  }

  const data: Record<string, unknown> = {};

  if (body.keyword !== undefined) {
    const keyword = normalizeKeyword(body.keyword);
    if (!keyword) {
      return NextResponse.json({ error: "invalid_keyword" }, { status: 400 });
    }
    data.keyword = keyword;
  }

  if (body.replyMessage !== undefined) data.replyMessage = body.replyMessage;

  if (body.status !== undefined) {
    data.status = body.status as "ACTIVE" | "INACTIVE";
  }

  if (body.campaignId !== undefined) {
    if (!body.campaignId) {
      data.campaignId = null;
    } else {
      const campaign = await prisma.campaign.findUnique({
        where: { id: body.campaignId },
        select: { orgId: true },
      });

      if (!campaign) {
        return NextResponse.json({ error: "campaign_not_found" }, { status: 404 });
      }

      if (campaign.orgId !== existing.orgId) {
        return NextResponse.json({ error: "campaign_org_mismatch" }, { status: 400 });
      }

      data.campaignId = body.campaignId;
    }
  }

  const route = await prisma.keywordRoute.update({
    where: { id: routeId },
    data,
  });

  return NextResponse.json({ data: route });
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ routeId: string }> },
) {
  const { userId } = await auth();

  if (!userId) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const { routeId } = await params;

  await prisma.keywordRoute.delete({
    where: { id: routeId },
  });

  return NextResponse.json({ ok: true });
}
