import { headers } from "next/headers";
import { prisma } from "@/lib/db";

function resolveOrigin() {
  const headerList = headers();
  const host = headerList.get("host");
  if (!host) return null;
  const proto = headerList.get("x-forwarded-proto") ?? "https";
  return `${proto}://${host}`;
}

export async function sendNoBidReminders(auctionId: string) {
  const auction = await prisma.auction.findUnique({
    where: { id: auctionId },
    select: {
      id: true,
      orgId: true,
      campaign: { select: { slug: true } },
    },
  });

  if (!auction) {
    throw new Error("Auction not found.");
  }

  const items = await prisma.auctionItem.findMany({
    where: {
      auctionId: auction.id,
      status: "PUBLISHED",
      bids: { none: {} },
    },
    select: { id: true, title: true },
  });

  if (!items.length) {
    return 0;
  }

  const bidders = await prisma.bid.findMany({
    where: { auctionItem: { auctionId: auction.id } },
    distinct: ["donorId"],
    select: { donorId: true },
  });

  const donorIds = bidders.map((bidder) => bidder.donorId).filter(Boolean);

  if (!donorIds.length) {
    return 0;
  }

  const donors = await prisma.donor.findMany({
    where: { id: { in: donorIds } },
    select: { id: true, primaryPhone: true, primaryEmail: true },
  });

  if (!donors.length) {
    return 0;
  }

  const origin = resolveOrigin();
  const catalogLink = origin
    ? `${origin}/campaigns/${auction.campaign.slug}/auction`
    : `/campaigns/${auction.campaign.slug}/auction`;
  const previewItems = items.slice(0, 5).map((item) => item.title);
  const remaining = items.length - previewItems.length;
  const listText = previewItems.join(", ");
  const extraText = remaining > 0 ? ` and ${remaining} more` : "";
  const body = `No-bid items are still available: ${listText}${extraText}. Browse: ${catalogLink}`;

  await Promise.all(
    donors.map((donor) => {
      if (donor.primaryPhone) {
        return prisma.messageSend.create({
          data: {
            orgId: auction.orgId,
            channel: "SMS",
            to: donor.primaryPhone,
            body,
            status: "QUEUED",
          },
        });
      }

      if (donor.primaryEmail) {
        return prisma.messageSend.create({
          data: {
            orgId: auction.orgId,
            channel: "EMAIL",
            to: donor.primaryEmail,
            subject: "No-bid items are still available",
            body,
            status: "QUEUED",
          },
        });
      }

      return null;
    }),
  );

  return donors.length;
}
