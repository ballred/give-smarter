import { headers } from "next/headers";
import { redirect } from "next/navigation";
import {
  OrderStatus,
  PaymentProvider,
  PaymentStatus,
  type LineItemType,
} from "@prisma/client";
import {
  getBidIncrement,
  resolveProxyBid,
  type BidIncrementRule,
} from "@give-smarter/core";
import { prisma } from "@/lib/db";
import { createOrderNumber, normalizeLineItems } from "@/lib/orders";
import { getStripeClient } from "@/lib/stripe";

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

function resolveOrigin() {
  const headerList = headers();
  const host = headerList.get("host");
  if (!host) return null;
  const proto = headerList.get("x-forwarded-proto") ?? "https";
  return `${proto}://${host}`;
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

  if (item.status === "CLOSED") {
    throw new Error("Bidding is closed for this item.");
  }

  const now = new Date();
  if (item.auction.opensAt && now < item.auction.opensAt) {
    throw new Error("Auction has not opened yet.");
  }
  if (item.auction.closesAt && now > item.auction.closesAt) {
    throw new Error("Auction has closed.");
  }

  const topBid = await prisma.bid.findFirst({
    where: { auctionItemId: item.id },
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
  const incomingMaxCents = Math.max(
    bidAmountCents,
    maxBidCents ?? bidAmountCents,
  );

  const currentMaxRecord = topBid
    ? await prisma.bid.findFirst({
        where: {
          auctionItemId: item.id,
          donorId: topBid.donorId,
          isAuto: false,
        },
        orderBy: { createdAt: "desc" },
      })
    : null;
  const currentMaxCents =
    currentMaxRecord?.maxBidAmount ??
    currentMaxRecord?.amount ??
    topBid?.maxBidAmount ??
    topBid?.amount ??
    item.startingBid;

  const bidPlacedAt = new Date();
  const resolution = resolveProxyBid(
    topBid
      ? {
          bidderId: topBid.donorId,
          currentBidAmount: currentBidCents / 100,
          maxBidAmount: currentMaxCents / 100,
          maxBidPlacedAt: currentMaxRecord?.createdAt ?? topBid.createdAt,
        }
      : null,
    {
      bidderId: donorId,
      bidAmount: bidAmountCents / 100,
      maxBidAmount: incomingMaxCents / 100,
      placedAt: bidPlacedAt,
    },
    rules,
  );
  const winningBidAmountCents = Math.round(
    resolution.winningBidAmount * 100,
  );
  const winningMaxBidAmountCents = Math.round(
    resolution.winningMaxBidAmount * 100,
  );
  const incomingEffectiveBidCents =
    resolution.winningBidderId === donorId
      ? winningBidAmountCents
      : incomingMaxCents;

  await prisma.$transaction(async (tx) => {
    const incomingBid = await tx.bid.create({
      data: {
        orgId: item.orgId,
        auctionItemId: item.id,
        donorId,
        amount: incomingEffectiveBidCents,
        maxBidAmount:
          incomingMaxCents > bidAmountCents ? incomingMaxCents : null,
      },
    });

    let winningId = incomingBid.id;

    if (resolution.winningBidderId !== donorId && topBid) {
      if (winningBidAmountCents !== topBid.amount) {
        const autoBid = await tx.bid.create({
          data: {
            orgId: item.orgId,
            auctionItemId: item.id,
            donorId: topBid.donorId,
            amount: winningBidAmountCents,
            maxBidAmount: winningMaxBidAmountCents,
            isAuto: true,
          },
        });
        winningId = autoBid.id;
      } else {
        winningId = topBid.id;
      }
    }

    await tx.bid.updateMany({
      where: { auctionItemId: item.id },
      data: { status: "OUTBID" },
    });
    await tx.bid.update({
      where: { id: winningId },
      data: { status: "WINNING" },
    });

  });

  if (resolution.outbidBidderId) {
    const outbidDonor = await prisma.donor.findUnique({
      where: { id: resolution.outbidBidderId },
      select: { primaryPhone: true, primaryEmail: true },
    });

    const origin = resolveOrigin();
    const link = origin
      ? `${origin}/campaigns/${item.auction.campaign.slug}/auction/${item.id}`
      : `/campaigns/${item.auction.campaign.slug}/auction/${item.id}`;
    const body = `You have been outbid on ${item.title}. Bid again: ${link}`;

    if (outbidDonor?.primaryPhone) {
      await prisma.messageSend.create({
        data: {
          orgId: item.orgId,
          channel: "SMS",
          to: outbidDonor.primaryPhone,
          body,
          status: "QUEUED",
        },
      });
    } else if (outbidDonor?.primaryEmail) {
      await prisma.messageSend.create({
        data: {
          orgId: item.orgId,
          channel: "EMAIL",
          to: outbidDonor.primaryEmail,
          subject: `Outbid on ${item.title}`,
          body,
          status: "QUEUED",
        },
      });
    }
  }

  const watchlist = await prisma.watchlist.findMany({
    where: {
      auctionItemId: item.id,
      donorId: {
        not: donorId,
      },
    },
    include: {
      donor: { select: { primaryPhone: true, primaryEmail: true } },
    },
  });

  if (watchlist.length) {
    const origin = resolveOrigin();
    const link = origin
      ? `${origin}/campaigns/${item.auction.campaign.slug}/auction/${item.id}`
      : `/campaigns/${item.auction.campaign.slug}/auction/${item.id}`;
    const currentBidText = `$${(winningBidAmountCents / 100).toFixed(2)}`;
    const body = `New bid on ${item.title}. Current bid is ${currentBidText}. ${link}`;

    await Promise.all(
      watchlist
        .filter((entry) => entry.donorId !== resolution.outbidBidderId)
        .map((entry) => {
          if (entry.donor.primaryPhone) {
            return prisma.messageSend.create({
              data: {
                orgId: item.orgId,
                channel: "SMS",
                to: entry.donor.primaryPhone,
                body,
                status: "QUEUED",
              },
            });
          }

          if (entry.donor.primaryEmail) {
            return prisma.messageSend.create({
              data: {
                orgId: item.orgId,
                channel: "EMAIL",
                to: entry.donor.primaryEmail,
                subject: `New bid on ${item.title}`,
                body,
                status: "QUEUED",
              },
            });
          }

          return null;
        }),
    );
  }

  redirect(`/campaigns/${item.auction.campaign.slug}/auction/${item.id}`);
}

export async function addToWatchlist(formData: FormData) {
  "use server";

  const itemId = String(formData.get("itemId") ?? "").trim();
  const email = String(formData.get("email") ?? "").trim();
  const firstName = String(formData.get("firstName") ?? "").trim();
  const lastName = String(formData.get("lastName") ?? "").trim();

  if (!itemId || !email) {
    throw new Error("Email is required to watch an item.");
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

  const donorId = await resolveDonor({
    orgId: item.orgId,
    email,
    firstName: firstName || undefined,
    lastName: lastName || undefined,
  });

  if (!donorId) {
    throw new Error("Email is required to watch this item.");
  }

  await prisma.watchlist.upsert({
    where: {
      auctionItemId_donorId: {
        auctionItemId: item.id,
        donorId,
      },
    },
    create: {
      orgId: item.orgId,
      auctionItemId: item.id,
      donorId,
    },
    update: {},
  });

  redirect(`/campaigns/${item.auction.campaign.slug}/auction/${item.id}?watch=1`);
}

export async function buyNow(formData: FormData) {
  "use server";

  const itemId = String(formData.get("itemId") ?? "").trim();
  const email = String(formData.get("email") ?? "").trim();
  const firstName = String(formData.get("firstName") ?? "").trim();
  const lastName = String(formData.get("lastName") ?? "").trim();

  if (!itemId) {
    throw new Error("Item is required.");
  }

  const item = await prisma.auctionItem.findUnique({
    where: { id: itemId },
    include: {
      auction: {
        include: {
          campaign: {
            select: { id: true, slug: true, orgId: true, organization: { select: { defaultCurrency: true } } },
          },
        },
      },
    },
  });

  if (!item) {
    throw new Error("Item not found.");
  }

  if (item.status === "CLOSED") {
    throw new Error("This item is no longer available.");
  }

  if (!item.buyNowPrice) {
    throw new Error("Buy now is not enabled for this item.");
  }

  const now = new Date();
  if (item.auction.opensAt && now < item.auction.opensAt) {
    throw new Error("Auction has not opened yet.");
  }
  if (item.auction.closesAt && now > item.auction.closesAt) {
    throw new Error("Auction has closed.");
  }

  const donorId = await resolveDonor({
    orgId: item.orgId,
    email: email || undefined,
    firstName: firstName || undefined,
    lastName: lastName || undefined,
  });

  if (!donorId) {
    throw new Error("Email is required to buy now.");
  }

  const currency =
    item.auction.campaign.organization.defaultCurrency ?? "USD";
  const amount = item.buyNowPrice;
  const benefitAmount = item.fmvAmount;
  const taxDeductibleAmount = Math.max(0, amount - benefitAmount);

  const normalized = normalizeLineItems(
    [
      {
        type: "AUCTION_WIN" as LineItemType,
        sourceId: item.id,
        description: item.title,
        quantity: 1,
        unitAmount: amount,
        totalAmount: amount,
        fmvAmount: item.fmvAmount,
        benefitAmount,
        taxDeductibleAmount,
      },
    ],
    currency,
  );

  const order = await prisma.order.create({
    data: {
      orgId: item.orgId,
      campaignId: item.auction.campaign.id,
      donorId,
      orderNumber: createOrderNumber(),
      status: OrderStatus.PENDING,
      totalAmount: normalized.totalAmount,
      currency,
      coverFeesAmount: 0,
      lineItems: {
        create: normalized.items.map((lineItem) => ({
          orgId: item.orgId,
          type: lineItem.type,
          sourceId: lineItem.sourceId,
          description: lineItem.description,
          quantity: lineItem.quantity,
          unitAmount: lineItem.unitAmount,
          totalAmount: lineItem.totalAmount,
          currency: lineItem.currency,
          fmvAmount: lineItem.fmvAmount,
          benefitAmount: lineItem.benefitAmount,
          taxDeductibleAmount: lineItem.taxDeductibleAmount,
          metadata: lineItem.metadata,
        })),
      },
    },
  });

  const payment = await prisma.payment.create({
    data: {
      orgId: item.orgId,
      orderId: order.id,
      provider: PaymentProvider.STRIPE,
      status: PaymentStatus.REQUIRES_PAYMENT,
      amount: normalized.totalAmount,
      currency,
      netAmount: normalized.totalAmount,
    },
  });

  await prisma.auctionItem.update({
    where: { id: item.id },
    data: { status: "CLOSED", closesAt: now },
  });

  const origin = resolveOrigin();
  if (!origin) {
    throw new Error("Missing request origin.");
  }

  const successUrl = `${origin}/campaigns/${item.auction.campaign.slug}/auction/${item.id}?success=1&orderId=${order.id}`;
  const cancelUrl = `${origin}/campaigns/${item.auction.campaign.slug}/auction/${item.id}?canceled=1`;

  const session = await getStripeClient().checkout.sessions.create({
    mode: "payment",
    submit_type: "pay",
    customer_email: email || undefined,
    line_items: normalized.items.map((lineItem) => ({
      price_data: {
        currency: lineItem.currency.toLowerCase(),
        product_data: {
          name: lineItem.description ?? "Auction item",
        },
        unit_amount: lineItem.unitAmount,
      },
      quantity: lineItem.quantity,
    })),
    success_url: successUrl,
    cancel_url: cancelUrl,
    client_reference_id: order.id,
    payment_intent_data: {
      metadata: {
        orgId: item.orgId,
        orderId: order.id,
        paymentId: payment.id,
        campaignId: item.auction.campaign.id,
        auctionItemId: item.id,
        ...(donorId ? { donorId } : {}),
      },
    },
  });

  if (!session.url) {
    throw new Error("Unable to start checkout session.");
  }

  redirect(session.url);
}
