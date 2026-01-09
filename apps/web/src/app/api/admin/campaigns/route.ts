import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { prisma } from "@/lib/db";
import { logAuditEntry } from "@/lib/audit";

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

type CampaignPayload = {
  orgId?: string;
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

export async function GET() {
  const { userId } = await auth();

  if (!userId) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const campaigns = await prisma.campaign.findMany({
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json({ data: campaigns });
}

export async function POST(request: Request) {
  const { userId } = await auth();

  if (!userId) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  let body: CampaignPayload;

  try {
    body = (await request.json()) as CampaignPayload;
  } catch {
    return NextResponse.json({ error: "invalid_json" }, { status: 400 });
  }

  if (!body.orgId || !body.name) {
    return NextResponse.json({ error: "missing_fields" }, { status: 400 });
  }

  const type = body.type ?? "EVENT";
  const status = body.status ?? "DRAFT";

  if (!CAMPAIGN_TYPES.has(type)) {
    return NextResponse.json({ error: "invalid_type" }, { status: 400 });
  }

  if (!CAMPAIGN_STATUSES.has(status)) {
    return NextResponse.json({ error: "invalid_status" }, { status: 400 });
  }

  const slug = normalizeSlug(body.slug ?? body.name);

  if (!slug) {
    return NextResponse.json({ error: "invalid_slug" }, { status: 400 });
  }

  const organization = await prisma.organization.findUnique({
    where: { id: body.orgId },
    select: { id: true },
  });

  if (!organization) {
    return NextResponse.json({ error: "org_not_found" }, { status: 404 });
  }

  const goalAmountCents =
    typeof body.goalAmountCents === "number"
      ? body.goalAmountCents
      : typeof body.goalAmount === "number"
        ? Math.round(body.goalAmount * 100)
        : null;

  if (goalAmountCents !== null && (!Number.isFinite(goalAmountCents) || goalAmountCents < 0)) {
    return NextResponse.json({ error: "invalid_goal" }, { status: 400 });
  }

  const campaign = await prisma.campaign.create({
    data: {
      orgId: body.orgId,
      name: body.name,
      slug,
      description: body.description ?? null,
      type: type as "EVENT" | "ONLINE" | "HYBRID" | "PEER_TO_PEER" | "AUCTION_ONLY",
      status: status as "DRAFT" | "PUBLISHED" | "ARCHIVED",
      startsAt: parseDate(body.startsAt),
      endsAt: parseDate(body.endsAt),
      goalAmount: goalAmountCents,
      heroTitle: body.heroTitle ?? null,
      heroMediaUrl: body.heroMediaUrl ?? null,
      storyContent: body.storyContent ?? null,
      seoTitle: body.seoTitle ?? null,
      seoDescription: body.seoDescription ?? null,
    },
  });

  const modules = Array.isArray(body.modules)
    ? body.modules.filter((module) => MODULE_TYPES.has(module))
    : [];

  if (modules.length) {
    await prisma.campaignModule.createMany({
      data: modules.map((module) => ({
        orgId: body.orgId as string,
        campaignId: campaign.id,
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

  await logAuditEntry({
    orgId: body.orgId,
    action: "campaign.create",
    targetType: "Campaign",
    targetId: campaign.id,
    afterData: { ...campaign, modules },
  });

  return NextResponse.json({ data: campaign }, { status: 201 });
}
