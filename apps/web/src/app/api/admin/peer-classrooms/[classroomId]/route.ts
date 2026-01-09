import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { prisma } from "@/lib/db";

export const runtime = "nodejs";

type PeerClassroomUpdate = {
  name?: string;
  slug?: string;
  grade?: string;
  teacherName?: string;
  story?: string;
  goalAmount?: number;
};

function normalizeSlug(input: string) {
  return input
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ classroomId: string }> },
) {
  const { userId } = await auth();

  if (!userId) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const { classroomId } = await params;

  const classroom = await prisma.peerFundraisingClassroom.findUnique({
    where: { id: classroomId },
  });

  if (!classroom) {
    return NextResponse.json({ error: "not_found" }, { status: 404 });
  }

  return NextResponse.json({ data: classroom });
}

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ classroomId: string }> },
) {
  const { userId } = await auth();

  if (!userId) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const { classroomId } = await params;

  let body: PeerClassroomUpdate;

  try {
    body = (await request.json()) as PeerClassroomUpdate;
  } catch {
    return NextResponse.json({ error: "invalid_json" }, { status: 400 });
  }

  const data: PeerClassroomUpdate = {
    ...body,
  };

  if (body.slug || body.name) {
    const base = body.slug ?? body.name ?? "";
    data.slug = normalizeSlug(base);
  }

  const classroom = await prisma.peerFundraisingClassroom.update({
    where: { id: classroomId },
    data: {
      name: data.name,
      slug: data.slug,
      grade: data.grade ?? undefined,
      teacherName: data.teacherName ?? undefined,
      story: data.story ?? undefined,
      goalAmount: data.goalAmount ?? undefined,
    },
  });

  return NextResponse.json({ data: classroom });
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ classroomId: string }> },
) {
  const { userId } = await auth();

  if (!userId) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const { classroomId } = await params;

  await prisma.peerFundraisingClassroom.delete({
    where: { id: classroomId },
  });

  return NextResponse.json({ ok: true });
}
