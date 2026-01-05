export type CampaignThemeTokens = {
  surface: string;
  surfaceAlt: string;
  ink: string;
  inkSoft: string;
  inkMuted: string;
  accent: string;
  accentStrong: string;
  highlight: string;
  border: string;
  card: string;
  heroGradient: string;
};

export const defaultCampaignTheme: CampaignThemeTokens = {
  surface: "#fbf7f2",
  surfaceAlt: "#f4ede4",
  ink: "#201a14",
  inkSoft: "#4b4037",
  inkMuted: "#7a6d63",
  accent: "#1f7a7a",
  accentStrong: "#155f5f",
  highlight: "#f4b860",
  border: "#e3d6c7",
  card: "#ffffff",
  heroGradient: "linear-gradient(120deg, #f4e3d4 0%, #d2ebe7 60%, #f9efe3 100%)",
};

export type CampaignCta = {
  label: string;
  href: string;
};

export type CampaignBlock =
  | {
      id?: string;
      type: "hero";
      data: {
        eyebrow?: string;
        title: string;
        subtitle?: string;
        highlight?: string;
        primaryCta?: CampaignCta;
        secondaryCta?: CampaignCta;
        stats?: { label: string; value: string }[];
        media?: { url: string; alt?: string; caption?: string };
      };
    }
  | {
      id?: string;
      type: "story";
      data: {
        title: string;
        body: string[];
        bullets?: string[];
        image?: { url: string; alt?: string };
      };
    }
  | {
      id?: string;
      type: "impactStats";
      data: {
        title?: string;
        stats: { label: string; value: string; detail?: string }[];
      };
    }
  | {
      id?: string;
      type: "donationTiers";
      data: {
        title?: string;
        subtitle?: string;
        tiers: { amount: string; label: string; detail?: string }[];
      };
    }
  | {
      id?: string;
      type: "gallery";
      data: {
        title?: string;
        images: { url: string; alt?: string }[];
      };
    }
  | {
      id?: string;
      type: "cta";
      data: {
        title: string;
        body?: string;
        primaryCta: CampaignCta;
        secondaryCta?: CampaignCta;
      };
    }
  | {
      id?: string;
      type: "sponsors";
      data: {
        title?: string;
        sponsors: { name: string; logoUrl: string; href?: string }[];
      };
    }
  | {
      id?: string;
      type: "faq";
      data: {
        title?: string;
        items: { question: string; answer: string }[];
      };
    };

export type CampaignPageType =
  | "HOME"
  | "TICKETS"
  | "AUCTION_CATALOG"
  | "ITEM_DETAIL"
  | "DONATE"
  | "PADDLE_RAISE"
  | "RAFFLE"
  | "STORE"
  | "PEER_TO_PEER"
  | "VOLUNTEER"
  | "SPONSORS"
  | "FAQ"
  | "PORTAL_LOGIN"
  | "THANK_YOU";

export type CampaignPage = {
  slug: string;
  title?: string;
  type?: CampaignPageType;
  blocks: CampaignBlock[];
};

export type CampaignModuleType =
  | "DONATIONS"
  | "TICKETING"
  | "AUCTION"
  | "PADDLE_RAISE"
  | "RAFFLE"
  | "VOTING"
  | "STORE"
  | "PEER_TO_PEER"
  | "LIVESTREAM"
  | "VOLUNTEER";

export const moduleTypeLabels: Record<CampaignModuleType, string> = {
  DONATIONS: "Donations",
  TICKETING: "Ticketing",
  AUCTION: "Auction",
  PADDLE_RAISE: "Paddle raise",
  RAFFLE: "Raffle",
  VOTING: "Voting",
  STORE: "Store",
  PEER_TO_PEER: "Peer to peer",
  LIVESTREAM: "Livestream",
  VOLUNTEER: "Volunteer",
};

export type CampaignModule = {
  type: CampaignModuleType;
  isEnabled: boolean;
  label?: string;
  description?: string;
  config?: Record<string, unknown>;
};

export type Campaign = {
  id?: string;
  name: string;
  slug: string;
  description?: string;
  status?: "DRAFT" | "PUBLISHED" | "ARCHIVED";
  type?: "EVENT" | "ONLINE" | "HYBRID" | "PEER_TO_PEER" | "AUCTION_ONLY";
  startsAt?: string;
  endsAt?: string;
  goalAmount?: number;
  heroTitle?: string;
  heroMediaUrl?: string;
  currency?: string;
  theme?: Partial<CampaignThemeTokens>;
  pages: CampaignPage[];
  modules: CampaignModule[];
};
