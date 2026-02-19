import { notFound } from "next/navigation";
import { prisma } from "@/lib/db";
import { LiveDisplayClient } from "./LiveDisplayClient";

type LiveDisplayPageProps = {
  params: Promise<{ campaignId: string }>;
};

export default async function LiveDisplayPage({
  params,
}: LiveDisplayPageProps) {
  const resolvedParams = await params;
  const campaign = await prisma.campaign.findUnique({
    where: { id: resolvedParams.campaignId },
    select: {
      id: true,
      name: true,
      goalAmount: true,
      organization: { select: { defaultCurrency: true } },
    },
  });

  if (!campaign) {
    notFound();
  }

  return (
    <LiveDisplayClient
      campaignId={campaign.id}
      campaignName={campaign.name}
      goalAmount={campaign.goalAmount ?? null}
      currency={campaign.organization.defaultCurrency ?? "USD"}
    />
  );
}
