import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { prisma } from "@/lib/db";

export const runtime = "nodejs";

const TEMPLATE_STATUSES = new Set(["DRAFT", "APPROVED", "ARCHIVED"]);

type EmailTemplateUpdatePayload = {
  name?: string;
  subject?: string;
  html?: string;
  status?: string;
};

export async function GET(
  _request: Request,
  { params }: { params: { templateId: string } },
) {
  const { userId } = auth();

  if (!userId) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const template = await prisma.emailTemplate.findUnique({
    where: { id: params.templateId },
  });

  if (!template) {
    return NextResponse.json({ error: "not_found" }, { status: 404 });
  }

  return NextResponse.json({ data: template });
}

export async function PATCH(
  request: Request,
  { params }: { params: { templateId: string } },
) {
  const { userId } = auth();

  if (!userId) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  let body: EmailTemplateUpdatePayload;

  try {
    body = (await request.json()) as EmailTemplateUpdatePayload;
  } catch {
    return NextResponse.json({ error: "invalid_json" }, { status: 400 });
  }

  if (body.status && !TEMPLATE_STATUSES.has(body.status)) {
    return NextResponse.json({ error: "invalid_status" }, { status: 400 });
  }

  const data: Record<string, unknown> = {};
  if (body.name !== undefined) data.name = body.name;
  if (body.subject !== undefined) data.subject = body.subject;
  if (body.html !== undefined) data.html = body.html;
  if (body.status !== undefined) {
    data.status = body.status as "DRAFT" | "APPROVED" | "ARCHIVED";
  }

  const template = await prisma.emailTemplate.update({
    where: { id: params.templateId },
    data,
  });

  return NextResponse.json({ data: template });
}

export async function DELETE(
  _request: Request,
  { params }: { params: { templateId: string } },
) {
  const { userId } = auth();

  if (!userId) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  await prisma.emailTemplate.delete({
    where: { id: params.templateId },
  });

  return NextResponse.json({ ok: true });
}
