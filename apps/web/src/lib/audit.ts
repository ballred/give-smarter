import { headers } from "next/headers";
import { auth } from "@clerk/nextjs/server";
import { prisma } from "@/lib/db";

type AuditInput = {
  orgId: string;
  action: string;
  targetType: string;
  targetId: string;
  beforeData?: object;
  afterData?: object;
};

async function resolveIpAddress() {
  const headerList = await headers();
  const forwardedFor = headerList.get("x-forwarded-for");
  if (forwardedFor) {
    return forwardedFor.split(",")[0]?.trim() ?? null;
  }
  return headerList.get("x-real-ip");
}

export async function logAuditEntry({
  orgId,
  action,
  targetType,
  targetId,
  beforeData,
  afterData,
}: AuditInput) {
  const { userId } = await auth();
  const actor = userId
    ? await prisma.user.findUnique({
        where: { clerkUserId: userId },
        select: { id: true },
      })
    : null;
  const headerList = await headers();
  const ipAddress = await resolveIpAddress();
  const userAgent = headerList.get("user-agent");

  return prisma.auditLogEntry.create({
    data: {
      orgId,
      actorUserId: actor?.id ?? null,
      action,
      targetType,
      targetId,
      beforeData,
      afterData,
      ipAddress,
      userAgent,
    },
  });
}
