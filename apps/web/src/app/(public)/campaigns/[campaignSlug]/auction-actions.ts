import { redirect } from "next/navigation";
import { getBidIncrement, type BidIncrementRule } from "@give-smarter/core";
import { prisma } from "@/lib/db";

function parseNumber(value: FormDataEntryValue | null) {
  if (!value) return null;
  const num = Number(value);
  return Number.isFinite(num) ? num : null;
}

function parseRules(input: unknown): BidIncrementRule[] | undefined {
  if (!Array.isArray(input)) return undefined;
  const rules: BidIncrementRule[] = [];

  for (const entry of input) {
    if (!entry || typeof entry !== "object") continue;
    const record = entry as Record<string, unknown>;
    const increment = Number(record.increment);
    if (!Number.isFinite(increment) || increment <= 0) continue;
    const upToValue = record.upTo;
    const upTo =
      upToValue === undefined
        ? undefined
        : Number.isFinite(Number(upToValue))
          ? Number(upToValue)
          : undefined;
    rules.push({ upTo, increment });
  }

  return rules.length ? rules : undefined;
}

async function resolveDonor({
  orgId,
  email,
  firstName,
  lastName,
}: {
  orgId: string;
  email?: string;
  firstName?: string;
  lastName?: string;
}) {
  if (!email) return null;

  const existing = await prisma.donor.findFirst({
    where: { orgId, primaryEmail: email },
    select: { id: true },
  });

  if (existing) {
    return existing.id;
  }

  const displayName = [firstName, lastName].filter(Boolean).join(" ");

  const donor = await prisma.donor.create({
    data: {
      orgId,
      primaryEmail: email,
      firstName: firstName || null,
      lastName: lastName || null,
      displayName: displayName || null,
    },
  });

  return donor.id;
}

export async function placeBid(formData: FormData) {
  "use server";

  const itemId = String(formData.get("itemId") ?? "").trim();
  const bidAmountInput = parseNumber(formData.get("bidAmount"));
  const maxBidInput = parseNumber(formData.get("maxBidAmount"));
  const email = String(formData.get("email") ?? "").trim();
  const firstName = String(formData.get("firstName") ?? "").trim();
  const lastName = String(formData.get("lastName") ?? "").trim();

  if (!itemId || bidAmountInput === null) {
    throw new Error("Bid amount is required.");
  }

  const item = await prisma.auctionItem.findUnique({
    where: { id: itemId },
    include: {
      auction: {
        include: {
          campaign: { select: { slug: true } },
        },
      },
    },
  });

  if (!item) {
    throw new Error("Item not found.");
  }

  const now = new Date();
  if (item.auction.opensAt && now < item.auction.opensAt) {
    throw new Error("Auction has not opened yet.");
  }
  if (item.auction.closesAt && now > item.auction.closesAt) {
    throw new Error("Auction has closed.");
  }

  const topBid = await prisma.bid.findFirst({
    where: { auctionItemId: item.id, status: "ACTIVE" },
    orderBy: [{ amount: "desc" }, { createdAt: "asc" }],
  });

  const currentBidCents = topBid?.amount ?? item.startingBid;
  const currentBidDollars = currentBidCents / 100;
  const rules = parseRules(item.bidIncrementOverride) ??
    parseRules(item.auction.bidIncrementRules);
  const incrementDollars = getBidIncrement(currentBidDollars, rules);
  const minBidCents = Math.round((currentBidDollars + incrementDollars) * 100);

  const bidAmountCents = Math.round(bidAmountInput * 100);

  if (bidAmountCents < minBidCents) {
    throw new Error(
      `Minimum bid is $${(minBidCents / 100).toFixed(2)}.`,
    );
  }

  const donorId = await resolveDonor({
    orgId: item.orgId,
    email: email || undefined,
    firstName: firstName || undefined,
    lastName: lastName || undefined,
  });

  if (!donorId) {
    throw new Error("Email is required to place a bid.");
  }

  const maxBidCents =
    maxBidInput && maxBidInput > 0 ? Math.round(maxBidInput * 100) : null;

  await prisma.bid.create({
    data: {
      orgId: item.orgId,
      auctionItemId: item.id,
      donorId,
      amount: bidAmountCents,
      maxBidAmount: maxBidCents,
    },
  });

  redirect(`/campaigns/${item.auction.campaign.slug}/auction/${item.id}`);
}
