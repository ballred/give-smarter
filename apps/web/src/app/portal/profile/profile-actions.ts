"use server";

import {
  CommunicationCategory,
  CommunicationChannel,
} from "@prisma/client";
import { prisma } from "@/lib/db";
import { getPortalDonors } from "../portal-data";

export const preferenceOptions = [
  {
    channel: CommunicationChannel.EMAIL,
    category: CommunicationCategory.TRANSACTIONAL,
    label: "Email receipts and confirmations",
  },
  {
    channel: CommunicationChannel.EMAIL,
    category: CommunicationCategory.MARKETING,
    label: "Email campaign updates",
  },
  {
    channel: CommunicationChannel.EMAIL,
    category: CommunicationCategory.OUTBID_ALERTS,
    label: "Email outbid alerts",
  },
  {
    channel: CommunicationChannel.SMS,
    category: CommunicationCategory.TRANSACTIONAL,
    label: "SMS receipts and confirmations",
  },
  {
    channel: CommunicationChannel.SMS,
    category: CommunicationCategory.MARKETING,
    label: "SMS campaign updates",
  },
  {
    channel: CommunicationChannel.SMS,
    category: CommunicationCategory.OUTBID_ALERTS,
    label: "SMS outbid alerts",
  },
];

export function preferenceKey(
  channel: CommunicationChannel,
  category: CommunicationCategory,
) {
  return `pref_${channel}_${category}`;
}

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
          orgId: donor.orgId,
          donorId: donor.id,
          channel: pref.channel,
          category: pref.category,
          optedIn: formData.get(preferenceKey(pref.channel, pref.category)) === "on",
        },
      }),
    ),
  );
}
