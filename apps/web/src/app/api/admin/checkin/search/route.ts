import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { prisma } from "@/lib/db";

export const runtime = "nodejs";

type SearchPayload = {
  query?: string;
};

export async function POST(request: Request) {
  const { userId } = await auth();

  if (!userId) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  let body: SearchPayload;

  try {
    body = (await request.json()) as SearchPayload;
  } catch {
    return NextResponse.json({ error: "invalid_json" }, { status: 400 });
  }

  const query = body.query?.trim();

  if (!query) {
    return NextResponse.json({ data: [] });
  }

  const attendees = await prisma.attendee.findMany({
    where: {
      OR: [
        { firstName: { contains: query, mode: "insensitive" } },
        { lastName: { contains: query, mode: "insensitive" } },
        { email: { contains: query, mode: "insensitive" } },
        { phone: { contains: query, mode: "insensitive" } },
      ],
    },
    take: 25,
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json({ data: attendees });
}
