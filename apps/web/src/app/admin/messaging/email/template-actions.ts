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

export async function createEmailTemplate(formData: FormData) {
  const orgId = String(formData.get("orgId") ?? "").trim();
  const name = String(formData.get("name") ?? "").trim();
  const subject = String(formData.get("subject") ?? "").trim();
  const html = String(formData.get("html") ?? "").trim();
  const status = parseStatus(formData.get("status"));
  const versionInput = parseNumber(formData.get("version"));

  if (!orgId) {
    throw new Error("Organization is required.");
  }

  if (!name) {
    throw new Error("Name is required.");
  }

  if (!subject) {
    throw new Error("Subject is required.");
  }

  if (!html) {
    throw new Error("HTML body is required.");
  }

  const organization = await prisma.organization.findUnique({
    where: { id: orgId },
    select: { id: true },
  });

  if (!organization) {
    throw new Error("Organization not found.");
  }

  const template = await prisma.emailTemplate.create({
    data: {
      orgId,
      name,
      subject,
      html,
      status,
      version:
        versionInput && versionInput > 0
          ? Math.floor(versionInput)
          : 1,
    },
  });

  return template.id;
}

export async function updateEmailTemplate(
  templateId: string,
  formData: FormData,
) {
  const name = String(formData.get("name") ?? "").trim();
  const subject = String(formData.get("subject") ?? "").trim();
  const html = String(formData.get("html") ?? "").trim();
  const status = parseStatus(formData.get("status"));

  if (!name) {
    throw new Error("Name is required.");
  }

  if (!subject) {
    throw new Error("Subject is required.");
  }

  if (!html) {
    throw new Error("HTML body is required.");
  }

  await prisma.emailTemplate.update({
    where: { id: templateId },
    data: {
      name,
      subject,
      html,
      status,
    },
  });
}
