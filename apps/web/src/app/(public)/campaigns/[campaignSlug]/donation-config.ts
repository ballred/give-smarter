import type { CampaignModule } from "@give-smarter/core";

type DonationTier = {
  amount: number;
  label?: string;
  description?: string;
};

export type DonationConfig = {
  tiers: DonationTier[];
  allowCustomAmount: boolean;
  coverFeesEnabled: boolean;
  coverFeesDefault: boolean;
  designationOptions: string[];
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function parseTier(input: unknown): DonationTier | null {
  if (!isRecord(input)) return null;
  const amount = typeof input.amount === "number" ? Math.round(input.amount) : null;
  if (!amount || amount <= 0) return null;

  const label = typeof input.label === "string" ? input.label : undefined;
  const description =
    typeof input.description === "string" ? input.description : undefined;

  return { amount, label, description };
}

function parseDesignations(input: unknown) {
  if (!Array.isArray(input)) return [];
  return input
    .map((item) => (typeof item === "string" ? item.trim() : ""))
    .filter(Boolean);
}

export function getDonationConfig(modules: CampaignModule[]): DonationConfig {
  const donationModule = modules.find((module) => module.type === "DONATIONS");
  const config = donationModule?.config;

  const tiers = Array.isArray(config?.tiers)
    ? config.tiers.map(parseTier).filter(Boolean)
    : [];

  const allowCustomAmount =
    typeof config?.allowCustomAmount === "boolean" ? config.allowCustomAmount : true;
  const coverFeesEnabled =
    typeof config?.coverFeesEnabled === "boolean" ? config.coverFeesEnabled : false;
  const coverFeesDefault =
    typeof config?.coverFeesDefault === "boolean" ? config.coverFeesDefault : false;
  const designationOptions = parseDesignations(config?.designationOptions);

  const fallbackTiers = [
    { amount: 2500, label: "$25" },
    { amount: 5000, label: "$50" },
    { amount: 10000, label: "$100" },
  ];

  return {
    tiers: tiers.length ? tiers : fallbackTiers,
    allowCustomAmount,
    coverFeesEnabled,
    coverFeesDefault,
    designationOptions,
  };
}
