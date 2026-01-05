import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { prisma } from "@/lib/db";

export const runtime = "nodejs";

const CAMPAIGN_TYPES = new Set([
  "EVENT",
  "ONLINE",
  "HYBRID",
  "PEER_TO_PEER",
  "AUCTION_ONLY",
]);

const CAMPAIGN_STATUSES = new Set(["DRAFT", "PUBLISHED", "ARCHIVED"]);

const MODULE_TYPES = new Set([
  "DONATIONS",
  "TICKETING",
  "AUCTION",
  "PADDLE_RAISE",
  "RAFFLE",
  "VOTING",
  "STORE",
  "PEER_TO_PEER",
  "LIVESTREAM",
  "VOLUNTEER",
]);

type CampaignUpdatePayload = {
  name?: string;
  slug?: string;
  description?: string | null;
  type?: string;
  status?: string;
  startsAt?: string | null;
  endsAt?: string | null;
  goalAmount?: number | null;
  goalAmountCents?: number | null;
  heroTitle?: string | null;
  heroMediaUrl?: string | null;
  storyContent?: string | null;
  seoTitle?: string | null;
  seoDescription?: string | null;
  modules?: string[];
};

function normalizeSlug(input: string) {
  return input
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

function parseDate(value?: string | null) {
  if (!value) return null;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
}

export async function GET(
  _request: Request,
  { params }: { params: { campaignId: string } },
) {
  const { userId } = auth();

  if (!userId) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const campaign = await prisma.campaign.findUnique({
    where: { id: params.campaignId },
    include: { modules: true },
  });

  if (!campaign) {
    return NextResponse.json({ error: "not_found" }, { status: 404 });
  }

  return NextResponse.json({ data: campaign });
}

export async function PATCH(
  request: Request,
  { params }: { params: { campaignId: string } },
) {
  const { userId } = auth();

  if (!userId) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  let body: CampaignUpdatePayload;

  try {
    body = (await request.json()) as CampaignUpdatePayload;
  } catch {
    return NextResponse.json({ error: "invalid_json" }, { status: 400 });
  }

  if (body.type && !CAMPAIGN_TYPES.has(body.type)) {
    return NextResponse.json({ error: "invalid_type" }, { status: 400 });
  }

  if (body.status && !CAMPAIGN_STATUSES.has(body.status)) {
    return NextResponse.json({ error: "invalid_status" }, { status: 400 });
  }

  const data: Record<string, unknown> = {};

  if (body.name !== undefined) data.name = body.name;
  if (body.slug !== undefined) {
    const slug = normalizeSlug(body.slug);
    if (!slug) {
      return NextResponse.json({ error: "invalid_slug" }, { status: 400 });
    }
    data.slug = slug;
  }
  if (body.description !== undefined) data.description = body.description;
  if (body.type !== undefined) {
    data.type = body.type as
      | "EVENT"
      | "ONLINE"
      | "HYBRID"
      | "PEER_TO_PEER"
      | "AUCTION_ONLY";
  }
  if (body.status !== undefined) {
    data.status = body.status as "DRAFT" | "PUBLISHED" | "ARCHIVED";
  }
  if (body.startsAt !== undefined) data.startsAt = parseDate(body.startsAt);
  if (body.endsAt !== undefined) data.endsAt = parseDate(body.endsAt);
  if (body.heroTitle !== undefined) data.heroTitle = body.heroTitle;
  if (body.heroMediaUrl !== undefined) data.heroMediaUrl = body.heroMediaUrl;
  if (body.storyContent !== undefined) data.storyContent = body.storyContent;
  if (body.seoTitle !== undefined) data.seoTitle = body.seoTitle;
  if (body.seoDescription !== undefined) data.seoDescription = body.seoDescription;

  if (body.goalAmount !== undefined || body.goalAmountCents !== undefined) {
    const goalAmountCents =
      typeof body.goalAmountCents === "number"
        ? body.goalAmountCents
        : typeof body.goalAmount === "number"
          ? Math.round(body.goalAmount * 100)
          : null;

    if (goalAmountCents !== null && (!Number.isFinite(goalAmountCents) || goalAmountCents < 0)) {
      return NextResponse.json({ error: "invalid_goal" }, { status: 400 });
    }

    data.goalAmount = goalAmountCents;
  }

  const campaign = await prisma.campaign.findUnique({
    where: { id: params.campaignId },
    select: { orgId: true },
  });

  if (!campaign) {
    return NextResponse.json({ error: "not_found" }, { status: 404 });
  }

  const updated = await prisma.campaign.update({
    where: { id: params.campaignId },
    data,
  });

  if (Array.isArray(body.modules)) {
    const desired = new Set(body.modules.filter((module) => MODULE_TYPES.has(module)));
    const existing = await prisma.campaignModule.findMany({
      where: { campaignId: params.campaignId },
      select: { id: true, type: true },
    });

    const toCreate = Array.from(desired).filter(
      (module) => !existing.some((item) => item.type === module),
    );
    const toDelete = existing
      .filter((item) => !desired.has(item.type))
      .map((item) => item.id);

    if (toCreate.length) {
      await prisma.campaignModule.createMany({
        data: toCreate.map((module) => ({
          orgId: campaign.orgId,
          campaignId: params.campaignId,
          type: module as
            | "DONATIONS"
            | "TICKETING"
            | "AUCTION"
            | "PADDLE_RAISE"
            | "RAFFLE"
            | "VOTING"
            | "STORE"
            | "PEER_TO_PEER"
            | "LIVESTREAM"
            | "VOLUNTEER",
          isEnabled: true,
        })),
        skipDuplicates: true,
      });
    }

    if (toDelete.length) {
      await prisma.campaignModule.deleteMany({
        where: { id: { in: toDelete } },
      });
    }
  }

  return NextResponse.json({ data: updated });
}

export async function DELETE(
  _request: Request,
  { params }: { params: { campaignId: string } },
) {
  const { userId } = auth();

  if (!userId) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  await prisma.campaign.delete({
    where: { id: params.campaignId },
  });

  return NextResponse.json({ ok: true });
}
