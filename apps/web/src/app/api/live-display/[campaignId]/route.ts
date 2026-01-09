import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export const runtime = "nodejs";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ campaignId: string }> },
) {
  const { campaignId } = await params;

  const campaign = await prisma.campaign.findUnique({
    where: { id: campaignId },
    select: {
      id: true,
      goalAmount: true,
      organization: { select: { defaultCurrency: true } },
    },
  });

  if (!campaign) {
    return NextResponse.json({ error: "not_found" }, { status: 404 });
  }

  const [donationTotals, pledgeTotals, auctionItems] = await Promise.all([
    prisma.orderLineItem.aggregate({
      where: {
        order: { campaignId: campaign.id },
        type: { in: ["DONATION", "FEE_COVERAGE_DONATION"] },
      },
      _sum: { totalAmount: true },
    }),
    prisma.paddleRaisePledge.aggregate({
      where: {
        campaignId: campaign.id,
        status: { in: ["PLEDGED", "PAID"] },
      },
      _sum: { amount: true },
    }),
    prisma.auctionItem.findMany({
      where: {
        auction: { campaignId: campaign.id },
        status: "PUBLISHED",
      },
      include: {
        bids: { orderBy: [{ amount: "desc" }, { createdAt: "asc" }], take: 1 },
      },
    }),
  ]);

  const donationTotal = donationTotals._sum.totalAmount ?? 0;
  const pledgeTotal = pledgeTotals._sum.amount ?? 0;
  const totalRaised = donationTotal + pledgeTotal;
  const topBids = auctionItems
    .map((item) => ({
      id: item.id,
      title: item.title,
      amount: item.bids[0]?.amount ?? item.startingBid,
    }))
    .sort((a, b) => b.amount - a.amount)
    .slice(0, 5);

  return NextResponse.json({
    data: {
      campaignId: campaign.id,
      donationTotal,
      pledgeTotal,
      totalRaised,
      topBids,
      goalAmount: campaign.goalAmount ?? null,
      currency: campaign.organization.defaultCurrency ?? "USD",
      updatedAt: new Date().toISOString(),
    },
  });
}
