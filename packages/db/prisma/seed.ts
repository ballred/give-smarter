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

  // Wipe all org data so seed is idempotent (child tables first)
  const orgId = organization.id;
  await prisma.messageSend.deleteMany({ where: { orgId } });
  await prisma.raffleTicket.deleteMany({ where: { orgId } });
  await prisma.raffleDraw.deleteMany({ where: { orgId } });
  await prisma.storeVariant.deleteMany({ where: { orgId } });
  await prisma.storeProduct.deleteMany({ where: { orgId } });
  await prisma.voteCandidate.deleteMany({ where: { orgId } });
  await prisma.votingContest.deleteMany({ where: { orgId } });
  await prisma.auctionItem.deleteMany({ where: { orgId } });
  await prisma.auctionCategory.deleteMany({ where: { orgId } });
  await prisma.auction.deleteMany({ where: { orgId } });
  await prisma.paddleRaiseLevel.deleteMany({ where: { orgId } });
  await prisma.raffle.deleteMany({ where: { orgId } });
  await prisma.volunteerShift.deleteMany({ where: { orgId } });
  await prisma.attendee.deleteMany({ where: { orgId } });
  await prisma.ticketType.deleteMany({ where: { orgId } });
  await prisma.procurementSubmission.deleteMany({ where: { orgId } });
  await prisma.procurementDonor.deleteMany({ where: { orgId } });
  await prisma.peerFundraiser.deleteMany({ where: { orgId } });
  await prisma.peerFundraisingClassroom.deleteMany({ where: { orgId } });
  await prisma.peerFundraisingTeam.deleteMany({ where: { orgId } });
  await prisma.keywordRoute.deleteMany({ where: { orgId } });
  await prisma.emailTemplate.deleteMany({ where: { orgId } });
  await prisma.smsTemplate.deleteMany({ where: { orgId } });
  await prisma.apiToken.deleteMany({ where: { orgId } });
  await prisma.webhookDelivery.deleteMany({ where: { orgId } });
  await prisma.webhookEndpoint.deleteMany({ where: { orgId } });
  await prisma.pageBlock.deleteMany({ where: { orgId } });
  await prisma.campaignPage.deleteMany({ where: { orgId } });
  await prisma.campaignModule.deleteMany({ where: { orgId } });
  await prisma.donor.deleteMany({ where: { orgId } });
  await prisma.campaign.deleteMany({ where: { orgId } });

  const campaign = await prisma.campaign.create({
    data: {
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
          { orgId: organization.id, type: "PEER_TO_PEER", isEnabled: true },
          { orgId: organization.id, type: "VOLUNTEER", isEnabled: true },
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
            type: "PEER_TO_PEER",
            slug: "peer-to-peer",
            title: "Peer to Peer",
            isPublished: true,
            blocks: {
              create: [
                {
                  orgId: organization.id,
                  type: "story",
                  sortOrder: 0,
                  data: {
                    title: "Give through a classroom or student",
                    body: [
                      "Support the students you love most by giving directly to their page.",
                      "Every gift rolls up to classroom and campaign totals.",
                    ],
                  },
                },
                {
                  orgId: organization.id,
                  type: "cta",
                  sortOrder: 1,
                  data: {
                    title: "Pick a fundraiser and make an impact",
                    body: "Choose a student, classroom, or team to support.",
                    primaryCta: {
                      label: "View fundraisers",
                      href: "#peer-to-peer",
                    },
                  },
                },
              ],
            },
          },
          {
            orgId: organization.id,
            type: "VOLUNTEER",
            slug: "volunteer",
            title: "Volunteer",
            isPublished: true,
            blocks: {
              create: [
                {
                  orgId: organization.id,
                  type: "story",
                  sortOrder: 0,
                  data: {
                    title: "Volunteer with us",
                    body: [
                      "Sign up for a shift and help make the gala a success.",
                      "Every volunteer hour supports our students.",
                    ],
                  },
                },
                {
                  orgId: organization.id,
                  type: "cta",
                  sortOrder: 1,
                  data: {
                    title: "Choose a shift",
                    body: "Pick a role and time that works for you.",
                    primaryCta: { label: "View shifts", href: "#volunteer" },
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
                    primaryCta: { label: "View items", href: "#auction" },
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
                    primaryCta: { label: "Shop now", href: "#store" },
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
                    primaryCta: { label: "Buy tickets", href: "#raffle" },
                  },
                },
              ],
            },
          },
          {
            orgId: organization.id,
            type: "VOTING",
            slug: "voting",
            title: "Voting",
            isPublished: true,
            blocks: {
              create: [
                {
                  orgId: organization.id,
                  type: "story",
                  sortOrder: 0,
                  data: {
                    title: "Vote to crown a winner",
                    body: [
                      "Each dollar is a vote for your favorite candidate.",
                      "Support the cause while cheering them on.",
                    ],
                  },
                },
                {
                  orgId: organization.id,
                  type: "cta",
                  sortOrder: 1,
                  data: {
                    title: "Cast your vote",
                    body: "Pick a candidate and submit your gift.",
                    primaryCta: { label: "Vote now", href: "#voting" },
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

  const classroom = await prisma.peerFundraisingClassroom.upsert({
    where: { id: "classroom_demo" },
    update: {},
    create: {
      id: "classroom_demo",
      orgId: organization.id,
      campaignId: campaign.id,
      name: "Ms. Park's Class",
      slug: "ms-parks-class",
      grade: "3rd Grade",
      teacherName: "Ms. Park",
      goalAmount: 150000,
    },
  });

  const team = await prisma.peerFundraisingTeam.upsert({
    where: { id: "team_demo" },
    update: {},
    create: {
      id: "team_demo",
      orgId: organization.id,
      campaignId: campaign.id,
      name: "Families of Lincoln",
      slug: "families-of-lincoln",
      goalAmount: 250000,
      story: "Parents and guardians rallying for enrichment programs.",
    },
  });

  await prisma.peerFundraiser.upsert({
    where: { id: "fundraiser_demo" },
    update: {},
    create: {
      id: "fundraiser_demo",
      orgId: organization.id,
      campaignId: campaign.id,
      donorId: donor.id,
      teamId: team.id,
      classroomId: classroom.id,
      name: "Ava Chen",
      slug: "ava-chen",
      story: "Help our classroom reach our reading goal!",
      goalAmount: 50000,
      status: "PUBLISHED",
    },
  });

  await prisma.volunteerShift.upsert({
    where: { id: "volunteer_shift_demo" },
    update: {},
    create: {
      id: "volunteer_shift_demo",
      orgId: organization.id,
      campaignId: campaign.id,
      name: "Guest check-in",
      description: "Welcome guests and scan tickets at the entrance.",
      startsAt: new Date("2026-03-12T16:30:00.000Z"),
      endsAt: new Date("2026-03-12T19:30:00.000Z"),
      capacity: 8,
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
