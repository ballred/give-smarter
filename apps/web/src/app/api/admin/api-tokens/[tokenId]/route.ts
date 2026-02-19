import { NextResponse } from "next/server";
import { auth } from "@/lib/admin-auth";
import { prisma } from "@/lib/db";
import { logAuditEntry } from "@/lib/audit";

export const runtime = "nodejs";

const TOKEN_SCOPES = new Set([
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
]);

type ApiTokenUpdatePayload = {
  name?: string;
  scopes?: string[];
};

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ tokenId: string }> },
) {
  const { userId } = await auth();
  const { tokenId } = await params;

  if (!userId) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const token = await prisma.apiToken.findUnique({
    where: { id: tokenId },
  });

  if (!token) {
    return NextResponse.json({ error: "not_found" }, { status: 404 });
  }

  return NextResponse.json({ data: token });
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ tokenId: string }> },
) {
  const { userId } = await auth();
  const { tokenId } = await params;

  if (!userId) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  let body: ApiTokenUpdatePayload;

  try {
    body = (await request.json()) as ApiTokenUpdatePayload;
  } catch {
    return NextResponse.json({ error: "invalid_json" }, { status: 400 });
  }

  const beforeToken = await prisma.apiToken.findUnique({
    where: { id: tokenId },
  });

  if (!beforeToken) {
    return NextResponse.json({ error: "not_found" }, { status: 404 });
  }

  const data: Record<string, unknown> = {};

  if (body.name !== undefined) data.name = body.name;
  if (body.scopes !== undefined) {
    if (!Array.isArray(body.scopes)) {
      return NextResponse.json({ error: "invalid_scopes" }, { status: 400 });
    }
    const scopes = body.scopes.filter((scope) => TOKEN_SCOPES.has(scope));
    if (!scopes.length) {
      return NextResponse.json({ error: "invalid_scopes" }, { status: 400 });
    }
    data.scopes = scopes;
  }

  const token = await prisma.apiToken.update({
    where: { id: tokenId },
    data,
  });

  await logAuditEntry({
    orgId: token.orgId,
    action: "api_token.update",
    targetType: "ApiToken",
    targetId: tokenId,
    beforeData: { id: beforeToken.id, name: beforeToken.name, scopes: beforeToken.scopes },
    afterData: { id: token.id, name: token.name, scopes: token.scopes },
  });

  return NextResponse.json({ data: token });
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ tokenId: string }> },
) {
  const { userId } = await auth();
  const { tokenId } = await params;

  if (!userId) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const token = await prisma.apiToken.findUnique({
    where: { id: tokenId },
  });

  if (!token) {
    return NextResponse.json({ error: "not_found" }, { status: 404 });
  }

  await prisma.apiToken.delete({
    where: { id: tokenId },
  });

  await logAuditEntry({
    orgId: token.orgId,
    action: "api_token.delete",
    targetType: "ApiToken",
    targetId: tokenId,
    beforeData: { id: token.id, name: token.name, scopes: token.scopes },
  });

  return NextResponse.json({ ok: true });
}
