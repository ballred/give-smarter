import crypto from "crypto";
import { prisma } from "@/lib/db";

const WEBHOOK_STATUSES = ["ACTIVE", "DISABLED"] as const;

const WEBHOOK_EVENTS = [
  "donor.created",
  "donor.updated",
  "donation.succeeded",
  "donation.refunded",
  "ticket.order.created",
  "attendee.checked_in",
  "auction.bid.placed",
  "auction.item.closed",
  "invoice.paid",
  "payout.created",
  "recurring.payment_failed",
] as const;

type WebhookStatus = (typeof WEBHOOK_STATUSES)[number];

type WebhookEvent = (typeof WEBHOOK_EVENTS)[number];

function parseStatus(value: FormDataEntryValue | null): WebhookStatus {
  const input = String(value ?? "ACTIVE").toUpperCase();
  if (WEBHOOK_STATUSES.includes(input as WebhookStatus)) {
    return input as WebhookStatus;
  }
  return "ACTIVE";
}

function parseEvents(values: FormDataEntryValue[]) {
  const events = values
    .map((value) => String(value))
    .filter((value): value is WebhookEvent =>
      WEBHOOK_EVENTS.includes(value as WebhookEvent),
    );
  return Array.from(new Set(events));
}

function validateUrl(value: string) {
  try {
    const url = new URL(value);
    return url.toString();
  } catch {
    return null;
  }
}

export async function createWebhook(formData: FormData) {
  const orgId = String(formData.get("orgId") ?? "").trim();
  const urlInput = String(formData.get("url") ?? "").trim();
  const status = parseStatus(formData.get("status"));
  const events = parseEvents(formData.getAll("events"));

  if (!orgId) {
    throw new Error("Organization is required.");
  }

  const url = validateUrl(urlInput);

  if (!url) {
    throw new Error("Valid URL is required.");
  }

  if (!events.length) {
    throw new Error("Select at least one event.");
  }

  const organization = await prisma.organization.findUnique({
    where: { id: orgId },
    select: { id: true },
  });

  if (!organization) {
    throw new Error("Organization not found.");
  }

  const secret = crypto.randomBytes(24).toString("hex");

  const webhook = await prisma.webhookEndpoint.create({
    data: {
      orgId,
      url,
      secret,
      events,
      status,
    },
  });

  return { id: webhook.id, secret };
}

export async function updateWebhook(
  webhookId: string,
  formData: FormData,
) {
  const urlInput = String(formData.get("url") ?? "").trim();
  const status = parseStatus(formData.get("status"));
  const events = parseEvents(formData.getAll("events"));

  const url = validateUrl(urlInput);

  if (!url) {
    throw new Error("Valid URL is required.");
  }

  if (!events.length) {
    throw new Error("Select at least one event.");
  }

  await prisma.webhookEndpoint.update({
    where: { id: webhookId },
    data: {
      url,
      events,
      status,
    },
  });
}

export const webhookEvents = WEBHOOK_EVENTS;
