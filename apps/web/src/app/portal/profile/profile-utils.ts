import {
  CommunicationCategory,
  CommunicationChannel,
} from "@prisma/client";

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
