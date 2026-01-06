import { headers } from "next/headers";
import { redirect } from "next/navigation";
import {
  OrderStatus,
  PaymentProvider,
  PaymentStatus,
  type LineItemType,
} from "@prisma/client";
import { prisma } from "@/lib/db";
import { createOrderNumber, normalizeLineItems } from "@/lib/orders";
import { getStripeClient } from "@/lib/stripe";

const FEE_RATE = 0.029;
const FEE_FIXED = 30;

function parseAmount(value: FormDataEntryValue | null) {
  if (!value) return null;
  const num = Number(value);
  return Number.isFinite(num) ? num : null;
}

function resolveOrigin() {
  const headerList = headers();
  const host = headerList.get("host");
  if (!host) return null;
  const proto = headerList.get("x-forwarded-proto") ?? "https";
  return `${proto}://${host}`;
}

function buildReturnUrl(origin: string, path: string, params: string) {
  const joiner = path.includes("?") ? "&" : "?";
  return `${origin}${path}${joiner}${params}`;
}

function buildLineItems({
  amountCents,
  coverFees,
}: {
  amountCents: number;
  coverFees: boolean;
}) {
  const items = [
    {
      type: "DONATION" as LineItemType,
      description: "Donation",
      unitAmount: amountCents,
      totalAmount: amountCents,
    },
  ];

  let coverFeesAmount = 0;

  if (coverFees) {
    coverFeesAmount = Math.round(amountCents * FEE_RATE + FEE_FIXED);
    if (coverFeesAmount > 0) {
      items.push({
        type: "FEE_COVERAGE_DONATION" as LineItemType,
        description: "Fee coverage",
        unitAmount: coverFeesAmount,
        totalAmount: coverFeesAmount,
      });
    }
  }

  return { items, coverFeesAmount };
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

async function resolvePeerAttribution({
  campaignId,
  fundraiserId,
  teamId,
  classroomId,
}: {
  campaignId: string;
  fundraiserId?: string | null;
  teamId?: string | null;
  classroomId?: string | null;
}) {
  let resolvedFundraiserId: string | null = null;
  let resolvedTeamId: string | null = null;
  let resolvedClassroomId: string | null = null;

  if (fundraiserId) {
    const fundraiser = await prisma.peerFundraiser.findUnique({
      where: { id: fundraiserId },
      select: { campaignId: true, teamId: true, classroomId: true },
    });

    if (!fundraiser) {
      throw new Error("Fundraiser not found.");
    }

    if (fundraiser.campaignId !== campaignId) {
      throw new Error("Fundraiser does not belong to this campaign.");
    }

    resolvedFundraiserId = fundraiserId;
    resolvedTeamId = fundraiser.teamId ?? null;
    resolvedClassroomId = fundraiser.classroomId ?? null;
  }

  if (teamId) {
    const team = await prisma.peerFundraisingTeam.findUnique({
      where: { id: teamId },
      select: { campaignId: true },
    });

    if (!team) {
      throw new Error("Team not found.");
    }

    if (team.campaignId !== campaignId) {
      throw new Error("Team does not belong to this campaign.");
    }

    if (resolvedTeamId && resolvedTeamId !== teamId) {
      throw new Error("Team does not match fundraiser.");
    }

    resolvedTeamId = teamId;
  }

  if (classroomId) {
    const classroom = await prisma.peerFundraisingClassroom.findUnique({
      where: { id: classroomId },
      select: { campaignId: true },
    });

    if (!classroom) {
      throw new Error("Classroom not found.");
    }

    if (classroom.campaignId !== campaignId) {
      throw new Error("Classroom does not belong to this campaign.");
    }

    if (resolvedClassroomId && resolvedClassroomId !== classroomId) {
      throw new Error("Classroom does not match fundraiser.");
    }

    resolvedClassroomId = classroomId;
  }

  if (!resolvedFundraiserId && !resolvedTeamId && !resolvedClassroomId) {
    return null;
  }

  return {
    fundraiserId: resolvedFundraiserId,
    teamId: resolvedTeamId,
    classroomId: resolvedClassroomId,
  };
}

export async function createDonationCheckout(formData: FormData) {
  "use server";

  const campaignId = String(formData.get("campaignId") ?? "").trim();
  const amountChoice = String(formData.get("amountChoice") ?? "").trim();
  const customAmountInput = parseAmount(formData.get("customAmount"));
  const coverFees = formData.get("coverFees") === "on";
  const email = String(formData.get("email") ?? "").trim();
  const firstName = String(formData.get("firstName") ?? "").trim();
  const lastName = String(formData.get("lastName") ?? "").trim();
  const designation = String(formData.get("designation") ?? "").trim();
  const tribute = String(formData.get("tribute") ?? "").trim();
  const fundraiserId = String(formData.get("fundraiserId") ?? "").trim();
  const teamId = String(formData.get("teamId") ?? "").trim();
  const classroomId = String(formData.get("classroomId") ?? "").trim();
  const utmSource = String(formData.get("utm_source") ?? "").trim();
  const utmMedium = String(formData.get("utm_medium") ?? "").trim();
  const utmCampaign = String(formData.get("utm_campaign") ?? "").trim();
  const utmContent = String(formData.get("utm_content") ?? "").trim();
  const utmTerm = String(formData.get("utm_term") ?? "").trim();
  const keyword = String(formData.get("keyword") ?? "").trim();
  const returnPathInput = String(formData.get("returnPath") ?? "").trim();

  if (!campaignId) {
    throw new Error("Campaign is required.");
  }

  const campaign = await prisma.campaign.findUnique({
    where: { id: campaignId },
    select: {
      id: true,
      slug: true,
      orgId: true,
      organization: { select: { defaultCurrency: true } },
    },
  });

  if (!campaign) {
    throw new Error("Campaign not found.");
  }

  let amountCents: number | null = null;

  if (amountChoice && amountChoice !== "custom") {
    const parsed = Number(amountChoice);
    amountCents = Number.isFinite(parsed) ? Math.round(parsed) : null;
  }

  if ((!amountCents || amountCents <= 0) && customAmountInput !== null) {
    amountCents = Math.round(customAmountInput * 100);
  }

  if (!amountCents || amountCents <= 0) {
    throw new Error("Donation amount is required.");
  }

  const { items, coverFeesAmount } = buildLineItems({
    amountCents,
    coverFees,
  });

  const currency = campaign.organization.defaultCurrency ?? "USD";
  const normalized = normalizeLineItems(items, currency);

  const donorId = await resolveDonor({
    orgId: campaign.orgId,
    email: email || undefined,
    firstName: firstName || undefined,
    lastName: lastName || undefined,
  });

  const metadata: Record<string, string> = {};
  if (designation) metadata.designation = designation;
  if (tribute) metadata.tribute = tribute;
  if (utmSource) metadata.utm_source = utmSource;
  if (utmMedium) metadata.utm_medium = utmMedium;
  if (utmCampaign) metadata.utm_campaign = utmCampaign;
  if (utmContent) metadata.utm_content = utmContent;
  if (utmTerm) metadata.utm_term = utmTerm;
  if (keyword) metadata.keyword = keyword;

  const attribution = await resolvePeerAttribution({
    campaignId: campaign.id,
    fundraiserId: fundraiserId || null,
    teamId: teamId || null,
    classroomId: classroomId || null,
  });

  const order = await prisma.order.create({
    data: {
      orgId: campaign.orgId,
      campaignId: campaign.id,
      donorId,
      orderNumber: createOrderNumber(),
      status: OrderStatus.PENDING,
      totalAmount: normalized.totalAmount,
      currency,
      coverFeesAmount,
      lineItems: {
        create: normalized.items.map((item) => ({
          orgId: campaign.orgId,
          type: item.type,
          description: item.description,
          quantity: item.quantity,
          unitAmount: item.unitAmount,
          totalAmount: item.totalAmount,
          currency: item.currency,
          metadata: Object.keys(metadata).length ? metadata : undefined,
          })),
      },
    },
    include: { lineItems: true },
  });

  if (attribution) {
    const donationItems = order.lineItems.filter(
      (item) => item.type === "DONATION",
    );

    if (donationItems.length) {
      await prisma.peerFundraisingAttribution.createMany({
        data: donationItems.map((item) => ({
          orgId: campaign.orgId,
          campaignId: campaign.id,
          orderLineItemId: item.id,
          fundraiserId: attribution.fundraiserId,
          teamId: attribution.teamId,
          classroomId: attribution.classroomId,
        })),
      });
    }
  }

  const payment = await prisma.payment.create({
    data: {
      orgId: campaign.orgId,
      orderId: order.id,
      provider: PaymentProvider.STRIPE,
      status: PaymentStatus.REQUIRES_PAYMENT,
      amount: normalized.totalAmount,
      currency,
      netAmount: normalized.totalAmount,
    },
  });

  const origin = resolveOrigin();
  if (!origin) {
    throw new Error("Missing request origin.");
  }

  const fallbackPath = `/campaigns/${campaign.slug}/donate`;
  const returnPath =
    returnPathInput && returnPathInput.startsWith("/")
      ? returnPathInput
      : fallbackPath;
  const successUrl = buildReturnUrl(
    origin,
    returnPath,
    `success=1&orderId=${order.id}`,
  );
  const cancelUrl = buildReturnUrl(origin, returnPath, "canceled=1");

  const session = await getStripeClient().checkout.sessions.create({
    mode: "payment",
    submit_type: "donate",
    customer_email: email || undefined,
    line_items: normalized.items.map((item) => ({
      price_data: {
        currency: item.currency.toLowerCase(),
        product_data: {
          name: item.description ?? "Donation",
        },
        unit_amount: item.unitAmount,
      },
      quantity: item.quantity,
    })),
    success_url: successUrl,
    cancel_url: cancelUrl,
    client_reference_id: order.id,
    payment_intent_data: {
      metadata: {
        orgId: campaign.orgId,
        orderId: order.id,
        paymentId: payment.id,
        campaignId: campaign.id,
        ...(donorId ? { donorId } : {}),
      },
    },
  });

  if (!session.url) {
    throw new Error("Unable to start checkout session.");
  }

  redirect(session.url);
}
