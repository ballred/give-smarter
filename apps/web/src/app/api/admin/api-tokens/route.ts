import crypto from "crypto";
import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { prisma } from "@/lib/db";

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

type ApiTokenPayload = {
  orgId?: string;
  name?: string;
  scopes?: string[];
};

function hashToken(token: string) {
  return crypto.createHash("sha256").update(token).digest("hex");
}

export async function GET() {
  const { userId } = await auth();

  if (!userId) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const tokens = await prisma.apiToken.findMany({
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json({ data: tokens });
}

export async function POST(request: Request) {
  const { userId } = await auth();

  if (!userId) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  let body: ApiTokenPayload;

  try {
    body = (await request.json()) as ApiTokenPayload;
  } catch {
    return NextResponse.json({ error: "invalid_json" }, { status: 400 });
  }

  if (!body.orgId || !body.name || !Array.isArray(body.scopes)) {
    return NextResponse.json({ error: "missing_fields" }, { status: 400 });
  }

  const scopes = body.scopes.filter((scope) => TOKEN_SCOPES.has(scope));

  if (!scopes.length) {
    return NextResponse.json({ error: "invalid_scopes" }, { status: 400 });
  }

  const organization = await prisma.organization.findUnique({
    where: { id: body.orgId },
    select: { id: true },
  });

  if (!organization) {
    return NextResponse.json({ error: "org_not_found" }, { status: 404 });
  }

  const token = crypto.randomBytes(24).toString("hex");

  const record = await prisma.apiToken.create({
    data: {
      orgId: body.orgId,
      name: body.name,
      tokenHash: hashToken(token),
      scopes,
    },
  });

  return NextResponse.json({ data: record, token }, { status: 201 });
}
