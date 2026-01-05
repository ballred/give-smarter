import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  const organization = await prisma.organization.upsert({
    where: { id: "org_demo" },
    update: {},
    create: {
      id: "org_demo",
      legalName: "GiveSmarter Demo Org",
      publicName: "GiveSmarter Demo",
      timezone: "America/Los_Angeles",
    },
  });

  const campaign = await prisma.campaign.upsert({
    where: { orgId_slug: { orgId: organization.id, slug: "sample" } },
    update: {},
    create: {
      orgId: organization.id,
      name: "Spring Gala 2026",
      slug: "sample",
      type: "EVENT",
      status: "PUBLISHED",
      description: "A community night to support student programs.",
      heroTitle: "Support every classroom, every day.",
      themeOverrides: {
        accent: "#1f7a7a",
        accentStrong: "#155f5f",
      },
      modules: {
        create: [
          {
            orgId: organization.id,
            type: "DONATIONS",
            isEnabled: true,
            config: {
              tiers: [
                {
                  amount: 5000,
                  label: "Supplies",
                  description: "Stock a classroom with supplies.",
                },
                {
                  amount: 15000,
                  label: "Experience",
                  description: "Fund a student field trip.",
                },
                {
                  amount: 50000,
                  label: "Legacy",
                  description: "Support a full enrichment program.",
                },
              ],
              allowCustomAmount: true,
              coverFeesEnabled: true,
              coverFeesDefault: false,
              designationOptions: ["General Fund", "STEM", "Arts"],
            },
          },
          { orgId: organization.id, type: "TICKETING", isEnabled: true },
          { orgId: organization.id, type: "AUCTION", isEnabled: true },
          { orgId: organization.id, type: "PADDLE_RAISE", isEnabled: true },
          { orgId: organization.id, type: "RAFFLE", isEnabled: true },
          { orgId: organization.id, type: "STORE", isEnabled: true },
          { orgId: organization.id, type: "VOTING", isEnabled: true },
        ],
      },
      pages: {
        create: [
          {
            orgId: organization.id,
            type: "HOME",
            slug: "home",
            title: "Welcome",
            isPublished: true,
            blocks: {
              create: [
                {
                  orgId: organization.id,
                  type: "hero",
                  sortOrder: 0,
                  data: {
                    eyebrow: "Spring Gala",
                    title: "Support every classroom, every day.",
                    subtitle:
                      "Join us for a night of connection, stories, and impact.",
                    highlight: "$250 funds a classroom library refresh.",
                    primaryCta: { label: "Get tickets", href: "#tickets" },
                    secondaryCta: { label: "Donate", href: "#donate" },
                    stats: [
                      { label: "Donors", value: "482" },
                      { label: "Raised", value: "$128k" },
                      { label: "Classrooms", value: "22" },
                    ],
                  },
                },
                {
                  orgId: organization.id,
                  type: "story",
                  sortOrder: 1,
                  data: {
                    title: "Why we gather",
                    body: [
                      "Our annual gala powers arts, STEM, and wellness programs.",
                      "Every gift keeps enrichment accessible for every student.",
                    ],
                    bullets: [
                      "Expand classroom resources",
                      "Fund field trips",
                      "Support teacher grants",
                    ],
                  },
                },
                {
                  orgId: organization.id,
                  type: "donationTiers",
                  sortOrder: 2,
                  data: {
                    title: "Give at any level",
                    tiers: [
                      { amount: "$50", label: "Supplies for one classroom" },
                      { amount: "$250", label: "STEM lab materials" },
                      { amount: "$1,000", label: "Arts enrichment" },
                    ],
                  },
                },
                {
                  orgId: organization.id,
                  type: "cta",
                  sortOrder: 3,
                  data: {
                    title: "Ready to make an impact?",
                    body: "Reserve your seats and share the campaign.",
                    primaryCta: { label: "Buy tickets", href: "#tickets" },
                    secondaryCta: { label: "Share", href: "#share" },
                  },
                },
              ],
            },
          },
          {
            orgId: organization.id,
            type: "DONATE",
            slug: "donate",
            title: "Donate",
            isPublished: true,
            blocks: {
              create: [
                {
                  orgId: organization.id,
                  type: "donationTiers",
                  sortOrder: 0,
                  data: {
                    title: "Make a gift",
                    subtitle: "Choose a level or enter your own amount.",
                    tiers: [
                      { amount: "$50", label: "Supplies" },
                      { amount: "$150", label: "Field trip" },
                      { amount: "$500", label: "Program support" },
                    ],
                  },
                },
                {
                  orgId: organization.id,
                  type: "cta",
                  sortOrder: 1,
                  data: {
                    title: "Your gift changes every classroom.",
                    body: "Every donation supports student enrichment.",
                    primaryCta: { label: "Donate now", href: "#donate" },
                  },
                },
              ],
            },
          },
          {
            orgId: organization.id,
            type: "TICKETS",
            slug: "tickets",
            title: "Tickets",
            isPublished: true,
            blocks: {
              create: [
                {
                  orgId: organization.id,
                  type: "story",
                  sortOrder: 0,
                  data: {
                    title: "Join the event",
                    body: [
                      "Reserve your seats and bring the whole community together.",
                      "Tickets include dinner and access to the live auction.",
                    ],
                  },
                },
                {
                  orgId: organization.id,
                  type: "cta",
                  sortOrder: 1,
                  data: {
                    title: "Ready to attend?",
                    body: "Select your ticket type and checkout securely.",
                    primaryCta: { label: "Get tickets", href: "#tickets" },
                  },
                },
              ],
            },
          },
          {
            orgId: organization.id,
            type: "AUCTION_CATALOG",
            slug: "auction",
            title: "Auction",
            isPublished: true,
            blocks: {
              create: [
                {
                  orgId: organization.id,
                  type: "story",
                  sortOrder: 0,
                  data: {
                    title: "Bid for a cause",
                    body: [
                      "Every winning bid supports student programs.",
                      "Browse the catalog and set your max bid.",
                    ],
                  },
                },
                {
                  orgId: organization.id,
                  type: "cta",
                  sortOrder: 1,
                  data: {
                    title: "Ready to bid?",
                    body: "Explore the items and place a bid from your phone.",
                    primaryCta: { label: "View items", href: \"#auction\" },
                  },
                },
              ],
            },
          },
          {
            orgId: organization.id,
            type: "STORE",
            slug: "store",
            title: "Store",
            isPublished: true,
            blocks: {
              create: [
                {
                  orgId: organization.id,
                  type: "story",
                  sortOrder: 0,
                  data: {
                    title: "Shop to support students",
                    body: [
                      "Grab limited edition merch and supporter bundles.",
                      "Every purchase goes directly to programs.",
                    ],
                  },
                },
                {
                  orgId: organization.id,
                  type: "cta",
                  sortOrder: 1,
                  data: {
                    title: "Ready to shop?",
                    body: "Select an item below and checkout securely.",
                    primaryCta: { label: "Shop now", href: \"#store\" },
                  },
                },
              ],
            },
          },
          {
            orgId: organization.id,
            type: "RAFFLE",
            slug: "raffle",
            title: "Raffle",
            isPublished: true,
            blocks: {
              create: [
                {
                  orgId: organization.id,
                  type: "story",
                  sortOrder: 0,
                  data: {
                    title: "Enter the raffle",
                    body: [
                      "Every ticket helps fund student programs.",
                      "Winners announced during the gala.",
                    ],
                  },
                },
                {
                  orgId: organization.id,
                  type: "cta",
                  sortOrder: 1,
                  data: {
                    title: "Grab your tickets",
                    body: "Choose a bundle and checkout securely.",
                    primaryCta: { label: "Buy tickets", href: \"#raffle\" },
                  },
                },
              ],
            },
          },
        ],
      },
    },
  });

  const donor = await prisma.donor.upsert({
    where: { id: "donor_demo" },
    update: {},
    create: {
      id: "donor_demo",
      orgId: organization.id,
      displayName: "Jamie Rivera",
      firstName: "Jamie",
      lastName: "Rivera",
      primaryEmail: "jamie@example.org",
    },
  });

  await prisma.ticketType.upsert({
    where: { id: "ticket_demo" },
    update: {},
    create: {
      id: "ticket_demo",
      orgId: organization.id,
      campaignId: campaign.id,
      name: "General Admission",
      description: "Includes dinner and program seating.",
      price: 15000,
      currency: "USD",
      capacity: 200,
    },
  });

  await prisma.attendee.upsert({
    where: { id: "attendee_demo" },
    update: {},
    create: {
      id: "attendee_demo",
      orgId: organization.id,
      campaignId: campaign.id,
      donorId: donor.id,
      firstName: "Jamie",
      lastName: "Rivera",
      email: "jamie@example.org",
      status: "REGISTERED",
    },
  });

  const auction = await prisma.auction.upsert({
    where: { id: "auction_demo" },
    update: {},
    create: {
      id: "auction_demo",
      orgId: organization.id,
      campaignId: campaign.id,
      name: "Spring Gala Auction",
      timezone: "America/Los_Angeles",
      status: "DRAFT",
    },
  });

  const category = await prisma.auctionCategory.upsert({
    where: { id: "auction_category_demo" },
    update: {},
    create: {
      id: "auction_category_demo",
      orgId: organization.id,
      auctionId: auction.id,
      name: "Experiences",
      sortOrder: 0,
    },
  });

  await prisma.auctionItem.upsert({
    where: { id: "auction_item_demo" },
    update: {},
    create: {
      id: "auction_item_demo",
      orgId: organization.id,
      auctionId: auction.id,
      categoryId: category.id,
      title: "Weekend Retreat Package",
      description: "Two-night stay plus dinner for two.",
      fmvAmount: 120000,
      startingBid: 25000,
      buyNowPrice: 200000,
      quantity: 1,
      status: "PUBLISHED",
      isFeatured: true,
    },
  });

  await prisma.paddleRaiseLevel.upsert({
    where: { id: "paddle_level_demo" },
    update: {},
    create: {
      id: "paddle_level_demo",
      orgId: organization.id,
      campaignId: campaign.id,
      amount: 25000,
      label: "Funds a classroom library refresh",
      sortOrder: 0,
      isActive: true,
    },
  });

  await prisma.raffle.upsert({
    where: { id: "raffle_demo" },
    update: {},
    create: {
      id: "raffle_demo",
      orgId: organization.id,
      campaignId: campaign.id,
      name: "Golden Ticket Raffle",
      status: "ACTIVE",
      ticketPrice: 1000,
      bundleRules: { label: "5 tickets for $40" },
      maxTicketsPerPerson: 50,
    },
  });

  await prisma.raffleTicket.upsert({
    where: { id: "raffle_ticket_demo" },
    update: {},
    create: {
      id: "raffle_ticket_demo",
      orgId: organization.id,
      raffleId: "raffle_demo",
      donorId: donor.id,
      quantity: 5,
    },
  });

  await prisma.storeProduct.upsert({
    where: { id: "store_product_demo" },
    update: {},
    create: {
      id: "store_product_demo",
      orgId: organization.id,
      campaignId: campaign.id,
      name: "Spirit Tee",
      description: "Limited edition fundraiser tee.",
      status: "ACTIVE",
      price: 2500,
      currency: "USD",
      sku: "TEE-2026",
      inventoryCount: 120,
      shippingRequired: false,
    },
  });

  await prisma.storeVariant.upsert({
    where: { id: "store_variant_demo" },
    update: {},
    create: {
      id: "store_variant_demo",
      orgId: organization.id,
      productId: "store_product_demo",
      name: "Adult Medium",
      sku: "TEE-2026-M",
      price: 2500,
      inventoryCount: 40,
    },
  });

  await prisma.votingContest.upsert({
    where: { id: "voting_demo" },
    update: {},
    create: {
      id: "voting_demo",
      orgId: organization.id,
      campaignId: campaign.id,
      name: "Principal for a Day",
      status: "ACTIVE",
    },
  });

  await prisma.voteCandidate.upsert({
    where: { id: "vote_candidate_demo" },
    update: {},
    create: {
      id: "vote_candidate_demo",
      orgId: organization.id,
      contestId: "voting_demo",
      name: "Principal for a Day",
      description: "Spend a day leading the school community.",
      sponsorName: "PTA Council",
    },
  });

  const procurementDonor = await prisma.procurementDonor.upsert({
    where: { id: "procurement_donor_demo" },
    update: {},
    create: {
      id: "procurement_donor_demo",
      orgId: organization.id,
      name: "Taylor Family",
      email: "taylor@example.org",
    },
  });

  await prisma.procurementSubmission.upsert({
    where: { id: "procurement_submission_demo" },
    update: {},
    create: {
      id: "procurement_submission_demo",
      orgId: organization.id,
      campaignId: campaign.id,
      procurementDonorId: procurementDonor.id,
      status: "PLEDGED",
      itemTitle: "Family Cooking Class",
      itemDescription: "Private class for eight guests.",
      fmvAmount: 50000,
    },
  });

  await prisma.emailTemplate.upsert({
    where: { id: "email_template_demo" },
    update: {},
    create: {
      id: "email_template_demo",
      orgId: organization.id,
      name: "Spring Gala Invite",
      subject: "You're invited to the Spring Gala",
      html: "<h1>Join us for the Spring Gala</h1><p>Reserve your seats today.</p>",
      status: "APPROVED",
      version: 1,
    },
  });

  await prisma.smsTemplate.upsert({
    where: { id: "sms_template_demo" },
    update: {},
    create: {
      id: "sms_template_demo",
      orgId: organization.id,
      name: "Outbid alert",
      body: "You're outbid on Weekend Retreat Package. Tap to bid again: {{link}}",
      status: "APPROVED",
      version: 1,
    },
  });

  await prisma.messageSend.upsert({
    where: { id: "message_send_demo" },
    update: {},
    create: {
      id: "message_send_demo",
      orgId: organization.id,
      channel: "EMAIL",
      emailTemplateId: "email_template_demo",
      to: "jamie@example.org",
      subject: "You're invited to the Spring Gala",
      body: "Join us for the Spring Gala.",
      status: "SENT",
      sentAt: new Date(),
    },
  });

  await prisma.keywordRoute.upsert({
    where: { id: "keyword_route_demo" },
    update: {},
    create: {
      id: "keyword_route_demo",
      orgId: organization.id,
      keyword: "GIVE",
      campaignId: campaign.id,
      replyMessage: "Thanks for supporting our campaign! Give here: {{link}}",
      status: "ACTIVE",
    },
  });

  await prisma.apiToken.upsert({
    where: { id: "api_token_demo" },
    update: {},
    create: {
      id: "api_token_demo",
      orgId: organization.id,
      name: "Demo data sync",
      tokenHash: "demo_token_hash",
      scopes: ["donors:read", "campaigns:read", "transactions:read"],
    },
  });

  await prisma.webhookEndpoint.upsert({
    where: { id: "webhook_demo" },
    update: {},
    create: {
      id: "webhook_demo",
      orgId: organization.id,
      url: "https://example.org/webhooks/givesmarter",
      secret: "demo_webhook_secret",
      events: ["donation.succeeded", "invoice.paid"],
      status: "ACTIVE",
    },
  });
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
