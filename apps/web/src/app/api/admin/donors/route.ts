import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { prisma } from "@/lib/db";

export const runtime = "nodejs";

type DonorPayload = {
  orgId?: string;
  displayName?: string | null;
  firstName?: string | null;
  lastName?: string | null;
  preferredName?: string | null;
  primaryEmail?: string | null;
  primaryPhone?: string | null;
};

export async function GET(request: Request) {
  const { userId } = await auth();

  if (!userId) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const url = new URL(request.url);
  const query = url.searchParams.get("q")?.trim();

  const donors = await prisma.donor.findMany({
    where: query
      ? {
          OR: [
            { displayName: { contains: query, mode: "insensitive" } },
            { firstName: { contains: query, mode: "insensitive" } },
            { lastName: { contains: query, mode: "insensitive" } },
            { primaryEmail: { contains: query, mode: "insensitive" } },
            { primaryPhone: { contains: query, mode: "insensitive" } },
          ],
        }
      : undefined,
    orderBy: { createdAt: "desc" },
    take: query ? 50 : 25,
  });

  return NextResponse.json({ data: donors });
}

export async function POST(request: Request) {
  const { userId } = await auth();

  if (!userId) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  let body: DonorPayload;

  try {
    body = (await request.json()) as DonorPayload;
  } catch {
    return NextResponse.json({ error: "invalid_json" }, { status: 400 });
  }

  if (!body.orgId) {
    return NextResponse.json({ error: "org_required" }, { status: 400 });
  }

  const organization = await prisma.organization.findUnique({
    where: { id: body.orgId },
    select: { id: true },
  });

  if (!organization) {
    return NextResponse.json({ error: "org_not_found" }, { status: 404 });
  }

  const donor = await prisma.donor.create({
    data: {
      orgId: body.orgId,
      displayName: body.displayName ?? null,
      firstName: body.firstName ?? null,
      lastName: body.lastName ?? null,
      preferredName: body.preferredName ?? null,
      primaryEmail: body.primaryEmail ?? null,
      primaryPhone: body.primaryPhone ?? null,
    },
  });

  return NextResponse.json({ data: donor }, { status: 201 });
}
