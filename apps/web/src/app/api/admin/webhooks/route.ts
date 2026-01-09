import crypto from "crypto";
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

type WebhookPayload = {
  orgId?: string;
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

export async function GET() {
  const { userId } = await auth();

  if (!userId) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const webhooks = await prisma.webhookEndpoint.findMany({
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json({ data: webhooks });
}

export async function POST(request: Request) {
  const { userId } = await auth();

  if (!userId) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  let body: WebhookPayload;

  try {
    body = (await request.json()) as WebhookPayload;
  } catch {
    return NextResponse.json({ error: "invalid_json" }, { status: 400 });
  }

  if (!body.orgId || !body.url || !Array.isArray(body.events)) {
    return NextResponse.json({ error: "missing_fields" }, { status: 400 });
  }

  if (body.status && !WEBHOOK_STATUSES.has(body.status)) {
    return NextResponse.json({ error: "invalid_status" }, { status: 400 });
  }

  const url = validateUrl(body.url);
  if (!url) {
    return NextResponse.json({ error: "invalid_url" }, { status: 400 });
  }

  const events = body.events.filter((event) => WEBHOOK_EVENTS.has(event));
  if (!events.length) {
    return NextResponse.json({ error: "invalid_events" }, { status: 400 });
  }

  const organization = await prisma.organization.findUnique({
    where: { id: body.orgId },
    select: { id: true },
  });

  if (!organization) {
    return NextResponse.json({ error: "org_not_found" }, { status: 404 });
  }

  const secret = crypto.randomBytes(24).toString("hex");

  const webhook = await prisma.webhookEndpoint.create({
    data: {
      orgId: body.orgId,
      url,
      secret,
      events,
      status: (body.status ?? "ACTIVE") as "ACTIVE" | "DISABLED",
    },
  });

  return NextResponse.json({ data: webhook, secret }, { status: 201 });
}
