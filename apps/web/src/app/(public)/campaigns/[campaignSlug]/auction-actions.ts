import { headers } from "next/headers";
import { redirect } from "next/navigation";
import {
  OrderStatus,
  PaymentProvider,
  PaymentStatus,
  Prisma,
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

const BID_RETRY_ATTEMPTS = 3;

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

async function resolveOrigin() {
  const headerList = await headers();
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
  db = prisma,
}: {
  orgId: string;
  email?: string;
  firstName?: string;
  lastName?: string;
  db?: Prisma.TransactionClient | typeof prisma;
}) {
  if (!email) return null;

  const existing = await db.donor.findFirst({
    where: { orgId, primaryEmail: email },
    select: { id: true },
  });

  if (existing) {
    return existing.id;
  }

  const displayName = [firstName, lastName].filter(Boolean).join(" ");

  const donor = await db.donor.create({
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

function isTransactionWriteConflict(error: unknown) {
  return (
    error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2034"
  );
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

  const bidAmountCents = Math.round(bidAmountInput * 100);
  const maxBidCents =
    maxBidInput && maxBidInput > 0 ? Math.round(maxBidInput * 100) : null;

  type PlaceBidResult = {
    orgId: string;
    donorId: string;
    itemId: string;
    itemTitle: string;
    campaignSlug: string;
    winningBidAmountCents: number;
    outbidBidderId?: string;
  };

  let bidResult: PlaceBidResult | null = null;

  for (let attempt = 1; attempt <= BID_RETRY_ATTEMPTS; attempt += 1) {
    try {
      bidResult = await prisma.$transaction(
        async (tx) => {
          const item = await tx.auctionItem.findUnique({
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
          const opensAt = item.opensAt ?? item.auction.opensAt;
          const closesAt = item.closesAt ?? item.auction.closesAt;

          if (item.isPreviewOnly) {
            throw new Error("This item is in preview.");
          }

          if (opensAt && now < opensAt) {
            throw new Error("Auction has not opened yet.");
          }
          if (closesAt && now > closesAt) {
            throw new Error("Auction has closed.");
          }

          const donorId = await resolveDonor({
            orgId: item.orgId,
            email: email || undefined,
            firstName: firstName || undefined,
            lastName: lastName || undefined,
            db: tx,
          });

          if (!donorId) {
            throw new Error("Email is required to place a bid.");
          }

          const topBid = await tx.bid.findFirst({
            where: { auctionItemId: item.id },
            orderBy: [{ amount: "desc" }, { createdAt: "asc" }],
          });

          const currentBidCents = topBid?.amount ?? item.startingBid;
          const currentBidDollars = currentBidCents / 100;
          const rules = parseRules(item.bidIncrementOverride) ??
            parseRules(item.auction.bidIncrementRules);
          const incrementDollars = getBidIncrement(currentBidDollars, rules);
          const minBidCents = Math.round(
            (currentBidDollars + incrementDollars) * 100,
          );

          if (bidAmountCents < minBidCents) {
            throw new Error(`Minimum bid is $${(minBidCents / 100).toFixed(2)}.`);
          }

          const incomingMaxCents = Math.max(
            bidAmountCents,
            maxBidCents ?? bidAmountCents,
          );

          const currentMaxRecord = topBid
            ? await tx.bid.findFirst({
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

          const winningBidAmountCents = Math.round(resolution.winningBidAmount * 100);
          const winningMaxBidAmountCents = Math.round(
            resolution.winningMaxBidAmount * 100,
          );
          const incomingEffectiveBidCents =
            resolution.winningBidderId === donorId
              ? winningBidAmountCents
              : incomingMaxCents;

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

          if (item.auction.antiSnipingMinutes && closesAt) {
            const extensionWindowStart = new Date(
              closesAt.getTime() - item.auction.antiSnipingMinutes * 60 * 1000,
            );
            if (bidPlacedAt >= extensionWindowStart && bidPlacedAt < closesAt) {
              const extendedClosesAt = new Date(
                closesAt.getTime() + item.auction.antiSnipingMinutes * 60 * 1000,
              );
              await tx.auctionItem.update({
                where: { id: item.id },
                data: { closesAt: extendedClosesAt },
              });
            }
          }

          return {
            orgId: item.orgId,
            donorId,
            itemId: item.id,
            itemTitle: item.title,
            campaignSlug: item.auction.campaign.slug,
            winningBidAmountCents,
            outbidBidderId: resolution.outbidBidderId,
          };
        },
        {
          isolationLevel: Prisma.TransactionIsolationLevel.Serializable,
        },
      );
      break;
    } catch (error) {
      if (isTransactionWriteConflict(error) && attempt < BID_RETRY_ATTEMPTS) {
        continue;
      }
      throw error;
    }
  }

  if (!bidResult) {
    throw new Error("Unable to place bid right now. Please try again.");
  }

  if (bidResult.outbidBidderId) {
    const outbidDonor = await prisma.donor.findUnique({
      where: { id: bidResult.outbidBidderId },
      select: { primaryPhone: true, primaryEmail: true },
    });

    const origin = await resolveOrigin();
    const link = origin
      ? `${origin}/campaigns/${bidResult.campaignSlug}/auction/${bidResult.itemId}`
      : `/campaigns/${bidResult.campaignSlug}/auction/${bidResult.itemId}`;
    const body = `You have been outbid on ${bidResult.itemTitle}. Bid again: ${link}`;

    if (outbidDonor?.primaryPhone) {
      await prisma.messageSend.create({
        data: {
          orgId: bidResult.orgId,
          channel: "SMS",
          to: outbidDonor.primaryPhone,
          body,
          status: "QUEUED",
        },
      });
    } else if (outbidDonor?.primaryEmail) {
      await prisma.messageSend.create({
        data: {
          orgId: bidResult.orgId,
          channel: "EMAIL",
          to: outbidDonor.primaryEmail,
          subject: `Outbid on ${bidResult.itemTitle}`,
          body,
          status: "QUEUED",
        },
      });
    }
  }

  const watchlist = await prisma.watchlist.findMany({
    where: {
      auctionItemId: bidResult.itemId,
      donorId: {
        not: bidResult.donorId,
      },
    },
    include: {
      donor: { select: { primaryPhone: true, primaryEmail: true } },
    },
  });

  if (watchlist.length) {
    const origin = await resolveOrigin();
    const link = origin
      ? `${origin}/campaigns/${bidResult.campaignSlug}/auction/${bidResult.itemId}`
      : `/campaigns/${bidResult.campaignSlug}/auction/${bidResult.itemId}`;
    const currentBidText = `$${(bidResult.winningBidAmountCents / 100).toFixed(2)}`;
    const body = `New bid on ${bidResult.itemTitle}. Current bid is ${currentBidText}. ${link}`;

    await Promise.all(
      watchlist
        .filter((entry) => entry.donorId !== bidResult.outbidBidderId)
        .map((entry) => {
          if (entry.donor.primaryPhone) {
            return prisma.messageSend.create({
              data: {
                orgId: bidResult.orgId,
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
                orgId: bidResult.orgId,
                channel: "EMAIL",
                to: entry.donor.primaryEmail,
                subject: `New bid on ${bidResult.itemTitle}`,
                body,
                status: "QUEUED",
              },
            });
          }

          return null;
        }),
    );
  }

  redirect(`/campaigns/${bidResult.campaignSlug}/auction/${bidResult.itemId}`);
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
      organization: { connect: { id: item.orgId } },
      auctionItem: { connect: { id: item.id } },
      donor: { connect: { id: donorId } },
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
  const opensAt = item.opensAt ?? item.auction.opensAt;
  const closesAt = item.closesAt ?? item.auction.closesAt;

  if (item.isPreviewOnly) {
    throw new Error("This item is in preview.");
  }

  if (opensAt && now < opensAt) {
    throw new Error("Auction has not opened yet.");
  }
  if (closesAt && now > closesAt) {
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
  const origin = await resolveOrigin();

  if (!origin) {
    throw new Error("Missing request origin.");
  }

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
          organization: { connect: { id: item.orgId } },
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
          metadata: lineItem.metadata as object | undefined,
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

  const successUrl = `${origin}/campaigns/${item.auction.campaign.slug}/auction/${item.id}?success=1&orderId=${order.id}`;
  const cancelUrl = `${origin}/campaigns/${item.auction.campaign.slug}/auction/${item.id}?canceled=1`;

  let session;
  try {
    session = await getStripeClient().checkout.sessions.create({
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
  } catch (error) {
    await prisma.$transaction([
      prisma.payment.update({
        where: { id: payment.id },
        data: { status: PaymentStatus.CANCELED },
      }),
      prisma.order.update({
        where: { id: order.id },
        data: { status: OrderStatus.CANCELED },
      }),
    ]);
    throw error;
  }

  if (!session.url) {
    await prisma.$transaction([
      prisma.payment.update({
        where: { id: payment.id },
        data: { status: PaymentStatus.CANCELED },
      }),
      prisma.order.update({
        where: { id: order.id },
        data: { status: OrderStatus.CANCELED },
      }),
    ]);
    throw new Error("Unable to start checkout session.");
  }

  const claim = await prisma.auctionItem.updateMany({
    where: { id: item.id, status: { not: "CLOSED" } },
    data: { status: "CLOSED", closesAt: now },
  });

  if (claim.count !== 1) {
    await prisma.$transaction([
      prisma.payment.update({
        where: { id: payment.id },
        data: { status: PaymentStatus.CANCELED },
      }),
      prisma.order.update({
        where: { id: order.id },
        data: { status: OrderStatus.CANCELED },
      }),
    ]);

    await getStripeClient().checkout.sessions
      .expire(session.id)
      .catch(() => undefined);

    throw new Error("This item was just purchased. Please refresh the catalog.");
  }

  redirect(session.url);
}
