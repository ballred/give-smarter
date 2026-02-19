import { NextResponse } from "next/server";
import { auth } from "@/lib/admin-auth";
import { prisma } from "@/lib/db";
import { logAuditEntry } from "@/lib/audit";

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

  const beforeClassroom = await prisma.peerFundraisingClassroom.findUnique({
    where: { id: classroomId },
  });

  if (!beforeClassroom) {
    return NextResponse.json({ error: "not_found" }, { status: 404 });
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

  await logAuditEntry({
    orgId: classroom.orgId,
    action: "peer_classroom.update",
    targetType: "PeerFundraisingClassroom",
    targetId: classroomId,
    beforeData: beforeClassroom,
    afterData: classroom,
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

  const classroom = await prisma.peerFundraisingClassroom.findUnique({
    where: { id: classroomId },
  });

  if (!classroom) {
    return NextResponse.json({ error: "not_found" }, { status: 404 });
  }

  await prisma.peerFundraisingClassroom.delete({
    where: { id: classroomId },
  });

  await logAuditEntry({
    orgId: classroom.orgId,
    action: "peer_classroom.delete",
    targetType: "PeerFundraisingClassroom",
    targetId: classroomId,
    beforeData: classroom,
  });

  return NextResponse.json({ ok: true });
}
