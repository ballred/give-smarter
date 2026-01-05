import { prisma } from "@/lib/db";

const HOUSEHOLD_ROLES = ["PRIMARY", "MEMBER"] as const;

type HouseholdRole = (typeof HOUSEHOLD_ROLES)[number];

function parseRole(value: FormDataEntryValue | null): HouseholdRole {
  const input = String(value ?? "MEMBER").toUpperCase();
  if (HOUSEHOLD_ROLES.includes(input as HouseholdRole)) {
    return input as HouseholdRole;
  }
  return "MEMBER";
}

export async function createHousehold(formData: FormData) {
  const orgId = String(formData.get("orgId") ?? "").trim();
  const name = String(formData.get("name") ?? "").trim();

  if (!orgId) {
    throw new Error("Organization is required.");
  }

  if (!name) {
    throw new Error("Household name is required.");
  }

  const organization = await prisma.organization.findUnique({
    where: { id: orgId },
    select: { id: true },
  });

  if (!organization) {
    throw new Error("Organization not found.");
  }

  const household = await prisma.household.create({
    data: {
      orgId,
      name,
    },
  });

  return household.id;
}

export async function addHouseholdMember(
  householdId: string,
  formData: FormData,
) {
  const donorId = String(formData.get("donorId") ?? "").trim();
  const role = parseRole(formData.get("role"));
  const relationship = String(formData.get("relationship") ?? "").trim();

  if (!donorId) {
    throw new Error("Donor is required.");
  }

  const household = await prisma.household.findUnique({
    where: { id: householdId },
    select: { id: true },
  });

  if (!household) {
    throw new Error("Household not found.");
  }

  await prisma.householdMembership.upsert({
    where: {
      householdId_donorId: {
        householdId,
        donorId,
      },
    },
    update: {
      role,
      relationship: relationship || null,
    },
    create: {
      householdId,
      donorId,
      role,
      relationship: relationship || null,
    },
  });
}
