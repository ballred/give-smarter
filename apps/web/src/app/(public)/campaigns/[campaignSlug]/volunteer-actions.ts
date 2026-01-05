import { redirect } from "next/navigation";
import { prisma } from "@/lib/db";

async function resolveDonor({
  orgId,
  email,
  name,
}: {
  orgId: string;
  email?: string;
  name?: string;
}) {
  if (!email) return null;

  const existing = await prisma.donor.findFirst({
    where: { orgId, primaryEmail: email },
    select: { id: true },
  });

  if (existing) {
    return existing.id;
  }

  const [firstName, ...rest] = (name ?? "").split(" ");
  const lastName = rest.join(" ");

  const donor = await prisma.donor.create({
    data: {
      orgId,
      primaryEmail: email,
      firstName: firstName || null,
      lastName: lastName || null,
      displayName: name || null,
    },
  });

  return donor.id;
}

export async function createVolunteerSignup(formData: FormData) {
  "use server";

  const shiftId = String(formData.get("shiftId") ?? "").trim();
  const name = String(formData.get("name") ?? "").trim();
  const email = String(formData.get("email") ?? "").trim();
  const phone = String(formData.get("phone") ?? "").trim();
  const returnPath = String(formData.get("returnPath") ?? "").trim();

  if (!shiftId) {
    throw new Error("Shift is required.");
  }

  if (!name) {
    throw new Error("Name is required.");
  }

  const shift = await prisma.volunteerShift.findUnique({
    where: { id: shiftId },
    include: { campaign: { select: { slug: true, orgId: true } } },
  });

  if (!shift) {
    throw new Error("Shift not found.");
  }

  if (shift.capacity !== null) {
    const signupCount = await prisma.volunteerSignup.count({
      where: { shiftId: shift.id, status: "CONFIRMED" },
    });

    if (signupCount >= shift.capacity) {
      throw new Error("Shift is full.");
    }
  }

  const donorId = await resolveDonor({
    orgId: shift.campaign.orgId,
    email: email || undefined,
    name: name || undefined,
  });

  await prisma.volunteerSignup.create({
    data: {
      orgId: shift.campaign.orgId,
      campaignId: shift.campaignId,
      shiftId: shift.id,
      donorId,
      name,
      email: email || null,
      phone: phone || null,
      status: "CONFIRMED",
    },
  });

  const fallback = `/campaigns/${shift.campaign.slug}/volunteer`;
  const destination =
    returnPath && returnPath.startsWith("/") ? returnPath : fallback;

  redirect(`${destination}?success=1`);
}
