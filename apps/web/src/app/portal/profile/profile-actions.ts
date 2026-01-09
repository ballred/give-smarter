"use server";

import { prisma } from "@/lib/db";
import { getPortalDonors } from "../portal-data";
import { preferenceKey, preferenceOptions } from "./profile-utils";

export async function updateDonorProfile(formData: FormData) {
  const donorId = String(formData.get("donorId") ?? "").trim();

  if (!donorId) {
    throw new Error("Missing donor profile.");
  }

  const portal = await getPortalDonors();
  const donor = portal?.donors.find((entry) => entry.id === donorId);

  if (!donor) {
    throw new Error("Donor profile not found.");
  }

  const preferredName = String(formData.get("preferredName") ?? "").trim();
  const primaryPhone = String(formData.get("primaryPhone") ?? "").trim();

  await prisma.donor.update({
    where: { id: donor.id },
    data: {
      preferredName: preferredName || null,
      primaryPhone: primaryPhone || null,
    },
  });

  await Promise.all(
    preferenceOptions.map((pref) =>
      prisma.communicationPreference.upsert({
        where: {
          donorId_channel_category: {
            donorId: donor.id,
            channel: pref.channel,
            category: pref.category,
          },
        },
        update: { optedIn: formData.get(preferenceKey(pref.channel, pref.category)) === "on" },
        create: {
          organization: { connect: { id: donor.orgId } },
          donor: { connect: { id: donor.id } },
          channel: pref.channel,
          category: pref.category,
          optedIn: formData.get(preferenceKey(pref.channel, pref.category)) === "on",
        },
      }),
    ),
  );
}
