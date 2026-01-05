import { prisma } from "@/lib/db";

export async function updateDonor(donorId: string, formData: FormData) {
  const displayName = String(formData.get("displayName") ?? "").trim();
  const firstName = String(formData.get("firstName") ?? "").trim();
  const lastName = String(formData.get("lastName") ?? "").trim();
  const preferredName = String(formData.get("preferredName") ?? "").trim();
  const primaryEmail = String(formData.get("primaryEmail") ?? "").trim();
  const primaryPhone = String(formData.get("primaryPhone") ?? "").trim();

  await prisma.donor.update({
    where: { id: donorId },
    data: {
      displayName: displayName || null,
      firstName: firstName || null,
      lastName: lastName || null,
      preferredName: preferredName || null,
      primaryEmail: primaryEmail || null,
      primaryPhone: primaryPhone || null,
    },
  });
}
