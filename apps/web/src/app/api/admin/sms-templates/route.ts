import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { prisma } from "@/lib/db";
import { logAuditEntry } from "@/lib/audit";

export const runtime = "nodejs";

const TEMPLATE_STATUSES = new Set(["DRAFT", "APPROVED", "ARCHIVED"]);

type SmsTemplatePayload = {
  orgId?: string;
  name?: string;
  body?: string;
  status?: string;
  version?: number;
};

export async function GET() {
  const { userId } = await auth();

  if (!userId) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const templates = await prisma.smsTemplate.findMany({
    orderBy: { updatedAt: "desc" },
  });

  return NextResponse.json({ data: templates });
}

export async function POST(request: Request) {
  const { userId } = await auth();

  if (!userId) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  let body: SmsTemplatePayload;

  try {
    body = (await request.json()) as SmsTemplatePayload;
  } catch {
    return NextResponse.json({ error: "invalid_json" }, { status: 400 });
  }

  if (!body.orgId) {
    return NextResponse.json({ error: "org_required" }, { status: 400 });
  }

  if (!body.name || !body.body) {
    return NextResponse.json({ error: "missing_fields" }, { status: 400 });
  }

  if (body.status && !TEMPLATE_STATUSES.has(body.status)) {
    return NextResponse.json({ error: "invalid_status" }, { status: 400 });
  }

  const organization = await prisma.organization.findUnique({
    where: { id: body.orgId },
    select: { id: true },
  });

  if (!organization) {
    return NextResponse.json({ error: "org_not_found" }, { status: 404 });
  }

  const template = await prisma.smsTemplate.create({
    data: {
      orgId: body.orgId,
      name: body.name,
      body: body.body,
      status: (body.status ?? "DRAFT") as "DRAFT" | "APPROVED" | "ARCHIVED",
      version:
        typeof body.version === "number" && body.version > 0
          ? Math.floor(body.version)
          : 1,
    },
  });

  await logAuditEntry({
    orgId: body.orgId,
    action: "sms_template.create",
    targetType: "SmsTemplate",
    targetId: template.id,
    afterData: template,
  });

  return NextResponse.json({ data: template }, { status: 201 });
}
