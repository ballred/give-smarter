import { auth, currentUser } from "@clerk/nextjs/server";
import type { CommunicationPreference } from "@prisma/client";
import { prisma } from "@/lib/db";

export type PortalIdentity = {
  userId: string;
  emails: string[];
  name?: string | null;
};

export type PortalDonor = {
  id: string;
  orgId: string;
  clerkUserId: string | null;
  preferredName: string | null;
  firstName: string | null;
  lastName: string | null;
  displayName: string | null;
  primaryEmail: string | null;
  primaryPhone: string | null;
  organization: {
    publicName: string;
    legalName: string;
  };
  communicationPreferences?: CommunicationPreference[];
};

type PortalData = {
  identity: PortalIdentity;
  donors: PortalDonor[];
};

async function getPortalIdentity(): Promise<PortalIdentity | null> {
  const { userId } = await auth();

  if (!userId) {
    return null;
  }

  const user = await currentUser();
  const emails =
    user?.emailAddresses
      .map((entry) => entry.emailAddress)
      .filter(Boolean)
      .map((email) => email.toLowerCase()) ?? [];
  const name = [user?.firstName, user?.lastName].filter(Boolean).join(" ");

  return {
    userId,
    emails,
    name: name || null,
  };
}

function buildDonorFilters(identity: PortalIdentity) {
  const filters: Array<Record<string, unknown>> = [];

  filters.push({ clerkUserId: identity.userId });

  for (const email of identity.emails) {
    filters.push({
      primaryEmail: { equals: email, mode: "insensitive" as const },
    });
  }

  return filters;
}

async function linkDonorsToClerkUser(
  donors: PortalDonor[],
  identity: PortalIdentity,
) {
  const emailSet = new Set(identity.emails.map((email) => email.toLowerCase()));

  const updates = donors
    .filter(
      (donor) =>
        !donor.clerkUserId &&
        donor.primaryEmail &&
        emailSet.has(donor.primaryEmail.toLowerCase()),
    )
    .map((donor) =>
      prisma.donor.update({
        where: { id: donor.id },
        data: { clerkUserId: identity.userId },
      }),
    );

  if (updates.length) {
    await Promise.all(updates);
  }
}

export async function getPortalDonors(
  options: { includePreferences?: boolean } = {},
): Promise<PortalData | null> {
  const identity = await getPortalIdentity();

  if (!identity) {
    return null;
  }

  const filters = buildDonorFilters(identity);

  if (!filters.length) {
    return { identity, donors: [] };
  }

  const include = options.includePreferences
    ? {
        organization: { select: { publicName: true, legalName: true } },
        communicationPreferences: true,
      }
    : { organization: { select: { publicName: true, legalName: true } } };

  const donors = await prisma.donor.findMany({
    where: { OR: filters },
    include,
    orderBy: { createdAt: "desc" },
  });

  await linkDonorsToClerkUser(donors as PortalDonor[], identity);

  return { identity, donors: donors as PortalDonor[] };
}
