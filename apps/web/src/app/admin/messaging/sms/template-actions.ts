import { prisma } from "@/lib/db";

const TEMPLATE_STATUSES = ["DRAFT", "APPROVED", "ARCHIVED"] as const;

type TemplateStatus = (typeof TEMPLATE_STATUSES)[number];

function parseNumber(value: FormDataEntryValue | null) {
  if (!value) return null;
  const num = Number(value);
  return Number.isFinite(num) ? num : null;
}

function parseStatus(value: FormDataEntryValue | null): TemplateStatus {
  const input = String(value ?? "DRAFT").toUpperCase();
  if (TEMPLATE_STATUSES.includes(input as TemplateStatus)) {
    return input as TemplateStatus;
  }
  return "DRAFT";
}

export async function createSmsTemplate(formData: FormData) {
  const orgId = String(formData.get("orgId") ?? "").trim();
  const name = String(formData.get("name") ?? "").trim();
  const body = String(formData.get("body") ?? "").trim();
  const status = parseStatus(formData.get("status"));
  const versionInput = parseNumber(formData.get("version"));

  if (!orgId) {
    throw new Error("Organization is required.");
  }

  if (!name) {
    throw new Error("Name is required.");
  }

  if (!body) {
    throw new Error("Body is required.");
  }

  const organization = await prisma.organization.findUnique({
    where: { id: orgId },
    select: { id: true },
  });

  if (!organization) {
    throw new Error("Organization not found.");
  }

  const template = await prisma.smsTemplate.create({
    data: {
      orgId,
      name,
      body,
      status,
      version:
        versionInput && versionInput > 0
          ? Math.floor(versionInput)
          : 1,
    },
  });

  return template.id;
}

export async function updateSmsTemplate(
  templateId: string,
  formData: FormData,
) {
  const name = String(formData.get("name") ?? "").trim();
  const body = String(formData.get("body") ?? "").trim();
  const status = parseStatus(formData.get("status"));

  if (!name) {
    throw new Error("Name is required.");
  }

  if (!body) {
    throw new Error("Body is required.");
  }

  await prisma.smsTemplate.update({
    where: { id: templateId },
    data: {
      name,
      body,
      status,
    },
  });
}
