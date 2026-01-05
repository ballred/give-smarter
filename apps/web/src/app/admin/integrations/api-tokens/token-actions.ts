import crypto from "crypto";
import { prisma } from "@/lib/db";

const TOKEN_SCOPES = [
  "donors:read",
  "donors:write",
  "campaigns:read",
  "campaigns:write",
  "transactions:read",
  "tickets:read",
  "tickets:write",
  "auctions:read",
  "auctions:write",
  "reports:read",
  "messages:read",
] as const;

type TokenScope = (typeof TOKEN_SCOPES)[number];

function parseScopes(values: FormDataEntryValue[]) {
  const scopes = values
    .map((value) => String(value))
    .filter((value): value is TokenScope =>
      TOKEN_SCOPES.includes(value as TokenScope),
    );
  return Array.from(new Set(scopes));
}

function hashToken(token: string) {
  return crypto.createHash("sha256").update(token).digest("hex");
}

export async function createApiToken(formData: FormData) {
  const orgId = String(formData.get("orgId") ?? "").trim();
  const name = String(formData.get("name") ?? "").trim();
  const scopes = parseScopes(formData.getAll("scopes"));

  if (!orgId) {
    throw new Error("Organization is required.");
  }

  if (!name) {
    throw new Error("Name is required.");
  }

  if (!scopes.length) {
    throw new Error("Select at least one scope.");
  }

  const organization = await prisma.organization.findUnique({
    where: { id: orgId },
    select: { id: true },
  });

  if (!organization) {
    throw new Error("Organization not found.");
  }

  const token = crypto.randomBytes(24).toString("hex");

  const record = await prisma.apiToken.create({
    data: {
      orgId,
      name,
      tokenHash: hashToken(token),
      scopes,
    },
  });

  return { id: record.id, token };
}

export async function updateApiToken(
  tokenId: string,
  formData: FormData,
) {
  const name = String(formData.get("name") ?? "").trim();
  const scopes = parseScopes(formData.getAll("scopes"));

  if (!name) {
    throw new Error("Name is required.");
  }

  if (!scopes.length) {
    throw new Error("Select at least one scope.");
  }

  await prisma.apiToken.update({
    where: { id: tokenId },
    data: {
      name,
      scopes,
    },
  });
}

export const apiTokenScopes = TOKEN_SCOPES;
