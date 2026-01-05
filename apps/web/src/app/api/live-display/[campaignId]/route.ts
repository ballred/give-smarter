import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export const runtime = "nodejs";

export async function GET(
  _request: Request,
  { params }: { params: { campaignId: string } },
) {
  const campaign = await prisma.campaign.findUnique({
    where: { id: params.campaignId },
    select: {
      id: true,
      goalAmount: true,
      organization: { select: { defaultCurrency: true } },
    },
  });

  if (!campaign) {
    return NextResponse.json({ error: "not_found" }, { status: 404 });
  }

  const [donationTotals, pledgeTotals] = await Promise.all([
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
  ]);

  const donationTotal = donationTotals._sum.totalAmount ?? 0;
  const pledgeTotal = pledgeTotals._sum.amount ?? 0;
  const totalRaised = donationTotal + pledgeTotal;

  return NextResponse.json({
    data: {
      campaignId: campaign.id,
      donationTotal,
      pledgeTotal,
      totalRaised,
      goalAmount: campaign.goalAmount ?? null,
      currency: campaign.organization.defaultCurrency ?? "USD",
      updatedAt: new Date().toISOString(),
    },
  });
}
