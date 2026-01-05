import type {
  Campaign,
  CampaignBlock,
  CampaignModule,
  CampaignPage,
} from "@give-smarter/core";
import type { Prisma } from "@prisma/client";
import { prisma } from "@/lib/db";

type CampaignRecord = Prisma.CampaignGetPayload<{
  include: {
    modules: true;
    pages: {
      include: {
        blocks: true;
      };
    };
  };
}>;

type PageBlockRecord = CampaignRecord["pages"][number]["blocks"][number];

type CampaignQueryOptions = {
  includeDraft?: boolean;
};

const supportedBlockTypes = new Set<CampaignBlock["type"]>([
  "hero",
  "story",
  "impactStats",
  "donationTiers",
  "gallery",
  "cta",
  "sponsors",
  "faq",
]);

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function isString(value: unknown): value is string {
  return typeof value === "string";
}

function mapBlock(block: PageBlockRecord): CampaignBlock | null {
  const blockType = block.type as CampaignBlock["type"];

  if (!supportedBlockTypes.has(blockType)) {
    return null;
  }

  if (!isRecord(block.data)) {
    return null;
  }

  const data = block.data as Record<string, unknown>;

  switch (blockType) {
    case "hero":
      if (!isString(data.title)) return null;
      break;
    case "story":
      if (!isString(data.title) || !Array.isArray(data.body)) return null;
      break;
    case "impactStats":
      if (!Array.isArray(data.stats)) return null;
      break;
    case "donationTiers":
      if (!Array.isArray(data.tiers)) return null;
      break;
    case "gallery":
      if (!Array.isArray(data.images)) return null;
      break;
    case "cta": {
      if (!isString(data.title)) return null;
      const primaryCta = data.primaryCta;
      if (!isRecord(primaryCta)) return null;
      if (!isString(primaryCta.label) || !isString(primaryCta.href)) return null;
      break;
    }
    case "sponsors":
      if (!Array.isArray(data.sponsors)) return null;
      break;
    case "faq":
      if (!Array.isArray(data.items)) return null;
      break;
  }

  return {
    id: block.id,
    type: blockType,
    data: block.data as CampaignBlock["data"],
  };
}

function mapPages(pages: CampaignRecord["pages"]): CampaignPage[] {
  return pages.map((page) => {
    const blocks = page.blocks
      .map(mapBlock)
      .filter((block): block is CampaignBlock => Boolean(block));

    return {
      slug: page.slug,
      title: page.title ?? undefined,
      type: page.type ?? undefined,
      blocks,
    } satisfies CampaignPage;
  });
}

function mapModules(modules: CampaignRecord["modules"]): CampaignModule[] {
  return modules.map((module) => {
    const config = isRecord(module.config) ? module.config : null;
    const label = config && isString(config.label) ? config.label : undefined;
    const description =
      config && isString(config.description) ? config.description : undefined;

    return {
      type: module.type,
      isEnabled: module.isEnabled,
      label,
      description,
    } satisfies CampaignModule;
  });
}

export async function getCampaignBySlug(
  slug: string,
  options: CampaignQueryOptions = {},
) {
  const campaign = await prisma.campaign.findFirst({
    where: {
      slug,
      ...(options.includeDraft ? {} : { status: "PUBLISHED" }),
    },
    include: {
      modules: {
        orderBy: { type: "asc" },
      },
      pages: {
        where: options.includeDraft ? {} : { isPublished: true },
        orderBy: { createdAt: "asc" },
        include: {
          blocks: {
            orderBy: { sortOrder: "asc" },
          },
        },
      },
    },
  });

  if (!campaign) {
    return null;
  }

  const theme = isRecord(campaign.themeOverrides)
    ? (campaign.themeOverrides as Campaign["theme"])
    : undefined;

  return {
    id: campaign.id,
    name: campaign.name,
    slug: campaign.slug,
    description: campaign.description ?? undefined,
    status: campaign.status,
    type: campaign.type,
    startsAt: campaign.startsAt?.toISOString(),
    endsAt: campaign.endsAt?.toISOString(),
    goalAmount: campaign.goalAmount ?? undefined,
    heroTitle: campaign.heroTitle ?? undefined,
    heroMediaUrl: campaign.heroMediaUrl ?? undefined,
    theme,
    pages: mapPages(campaign.pages),
    modules: mapModules(campaign.modules),
  } satisfies Campaign;
}
