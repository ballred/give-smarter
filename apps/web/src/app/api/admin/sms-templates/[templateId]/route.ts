import { NextResponse } from "next/server";
import { auth } from "@/lib/admin-auth";
import { prisma } from "@/lib/db";
import { logAuditEntry } from "@/lib/audit";

export const runtime = "nodejs";

const TEMPLATE_STATUSES = new Set(["DRAFT", "APPROVED", "ARCHIVED"]);

type SmsTemplateUpdatePayload = {
  name?: string;
  body?: string;
  status?: string;
};

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ templateId: string }> },
) {
  const { userId } = await auth();

  if (!userId) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const { templateId } = await params;

  const template = await prisma.smsTemplate.findUnique({
    where: { id: templateId },
  });

  if (!template) {
    return NextResponse.json({ error: "not_found" }, { status: 404 });
  }

  return NextResponse.json({ data: template });
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ templateId: string }> },
) {
  const { userId } = await auth();

  if (!userId) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const { templateId } = await params;

  let body: SmsTemplateUpdatePayload;

  try {
    body = (await request.json()) as SmsTemplateUpdatePayload;
  } catch {
    return NextResponse.json({ error: "invalid_json" }, { status: 400 });
  }

  if (body.status && !TEMPLATE_STATUSES.has(body.status)) {
    return NextResponse.json({ error: "invalid_status" }, { status: 400 });
  }

  const beforeTemplate = await prisma.smsTemplate.findUnique({
    where: { id: templateId },
  });

  if (!beforeTemplate) {
    return NextResponse.json({ error: "not_found" }, { status: 404 });
  }

  const data: Record<string, unknown> = {};
  if (body.name !== undefined) data.name = body.name;
  if (body.body !== undefined) data.body = body.body;
  if (body.status !== undefined) {
    data.status = body.status as "DRAFT" | "APPROVED" | "ARCHIVED";
  }

  const template = await prisma.smsTemplate.update({
    where: { id: templateId },
    data,
  });

  await logAuditEntry({
    orgId: template.orgId,
    action: "sms_template.update",
    targetType: "SmsTemplate",
    targetId: templateId,
    beforeData: beforeTemplate,
    afterData: template,
  });

  return NextResponse.json({ data: template });
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ templateId: string }> },
) {
  const { userId } = await auth();

  if (!userId) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const { templateId } = await params;

  const template = await prisma.smsTemplate.findUnique({
    where: { id: templateId },
  });

  if (!template) {
    return NextResponse.json({ error: "not_found" }, { status: 404 });
  }

  await prisma.smsTemplate.delete({
    where: { id: templateId },
  });

  await logAuditEntry({
    orgId: template.orgId,
    action: "sms_template.delete",
    targetType: "SmsTemplate",
    targetId: templateId,
    beforeData: template,
  });

  return NextResponse.json({ ok: true });
}
