import { NextResponse } from "next/server";
import { auth } from "@/lib/admin-auth";
import { prisma } from "@/lib/db";
import { logAuditEntry } from "@/lib/audit";

export const runtime = "nodejs";

const CHANNELS = new Set(["EMAIL", "SMS"]);

type MessageSendPayload = {
  orgId?: string;
  channel?: string;
  to?: string;
  subject?: string | null;
  body?: string;
  emailTemplateId?: string | null;
  smsTemplateId?: string | null;
  scheduledAt?: string | null;
};

export async function GET() {
  const { userId } = await auth();

  if (!userId) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const sends = await prisma.messageSend.findMany({
    orderBy: { createdAt: "desc" },
    take: 100,
  });

  return NextResponse.json({ data: sends });
}

export async function POST(request: Request) {
  const { userId } = await auth();

  if (!userId) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  let body: MessageSendPayload;

  try {
    body = (await request.json()) as MessageSendPayload;
  } catch {
    return NextResponse.json({ error: "invalid_json" }, { status: 400 });
  }

  if (!body.orgId) {
    return NextResponse.json({ error: "org_required" }, { status: 400 });
  }

  if (!body.channel || !CHANNELS.has(body.channel)) {
    return NextResponse.json({ error: "invalid_channel" }, { status: 400 });
  }

  if (!body.to || !body.body) {
    return NextResponse.json({ error: "missing_fields" }, { status: 400 });
  }

  if (body.channel === "EMAIL" && !body.subject) {
    return NextResponse.json({ error: "subject_required" }, { status: 400 });
  }

  const organization = await prisma.organization.findUnique({
    where: { id: body.orgId },
    select: { id: true },
  });

  if (!organization) {
    return NextResponse.json({ error: "org_not_found" }, { status: 404 });
  }

  const scheduledAt = body.scheduledAt
    ? new Date(body.scheduledAt)
    : null;

  if (scheduledAt && Number.isNaN(scheduledAt.getTime())) {
    return NextResponse.json({ error: "invalid_scheduled_at" }, { status: 400 });
  }

  const send = await prisma.messageSend.create({
    data: {
      orgId: body.orgId,
      channel: body.channel as "EMAIL" | "SMS",
      to: body.to,
      subject: body.subject ?? null,
      body: body.body,
      emailTemplateId: body.emailTemplateId ?? null,
      smsTemplateId: body.smsTemplateId ?? null,
      scheduledAt,
      status: "QUEUED",
    },
  });

  await logAuditEntry({
    orgId: body.orgId,
    action: "message_send.create",
    targetType: "MessageSend",
    targetId: send.id,
    afterData: send,
  });

  return NextResponse.json({ data: send }, { status: 201 });
}
