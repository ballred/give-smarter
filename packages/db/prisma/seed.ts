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
          { orgId: organization.id, type: "DONATIONS", isEnabled: true },
          { orgId: organization.id, type: "TICKETING", isEnabled: true },
          { orgId: organization.id, type: "AUCTION", isEnabled: true },
          { orgId: organization.id, type: "PADDLE_RAISE", isEnabled: true },
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
        ],
      },
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

  await prisma.auction.upsert({
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
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
