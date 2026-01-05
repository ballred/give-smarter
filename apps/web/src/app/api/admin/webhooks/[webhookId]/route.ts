import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { prisma } from "@/lib/db";

export const runtime = "nodejs";

const WEBHOOK_STATUSES = new Set(["ACTIVE", "DISABLED"]);

const WEBHOOK_EVENTS = new Set([
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
]);

type WebhookUpdatePayload = {
  url?: string;
  events?: string[];
  status?: string;
};

function validateUrl(value: string) {
  try {
    const url = new URL(value);
    return url.toString();
  } catch {
    return null;
  }
}

export async function GET(
  _request: Request,
  { params }: { params: { webhookId: string } },
) {
  const { userId } = auth();

  if (!userId) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const webhook = await prisma.webhookEndpoint.findUnique({
    where: { id: params.webhookId },
  });

  if (!webhook) {
    return NextResponse.json({ error: "not_found" }, { status: 404 });
  }

  return NextResponse.json({ data: webhook });
}

export async function PATCH(
  request: Request,
  { params }: { params: { webhookId: string } },
) {
  const { userId } = auth();

  if (!userId) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  let body: WebhookUpdatePayload;

  try {
    body = (await request.json()) as WebhookUpdatePayload;
  } catch {
    return NextResponse.json({ error: "invalid_json" }, { status: 400 });
  }

  if (body.status && !WEBHOOK_STATUSES.has(body.status)) {
    return NextResponse.json({ error: "invalid_status" }, { status: 400 });
  }

  const data: Record<string, unknown> = {};

  if (body.url !== undefined) {
    const url = validateUrl(body.url);
    if (!url) {
      return NextResponse.json({ error: "invalid_url" }, { status: 400 });
    }
    data.url = url;
  }

  if (body.events !== undefined) {
    if (!Array.isArray(body.events)) {
      return NextResponse.json({ error: "invalid_events" }, { status: 400 });
    }
    const events = body.events.filter((event) => WEBHOOK_EVENTS.has(event));
    if (!events.length) {
      return NextResponse.json({ error: "invalid_events" }, { status: 400 });
    }
    data.events = events;
  }

  if (body.status !== undefined) {
    data.status = body.status as "ACTIVE" | "DISABLED";
  }

  const webhook = await prisma.webhookEndpoint.update({
    where: { id: params.webhookId },
    data,
  });

  return NextResponse.json({ data: webhook });
}

export async function DELETE(
  _request: Request,
  { params }: { params: { webhookId: string } },
) {
  const { userId } = auth();

  if (!userId) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  await prisma.webhookEndpoint.delete({
    where: { id: params.webhookId },
  });

  return NextResponse.json({ ok: true });
}
