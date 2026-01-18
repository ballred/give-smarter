import { randomUUID } from "crypto";
import { prisma } from "@give-smarter/db";
import { sendEmail } from "./email";
import { sendSms } from "./sms";

type ProcessQueuedMessageSendsOptions = {
  limit?: number;
  now?: Date;
  claimTimeoutMs?: number;
};

export type ProcessQueuedMessageSendsResult = {
  processed: number;
  delivered: number;
  failed: number;
};

function getEligibleScheduledFilter(now: Date) {
  return {
    OR: [{ scheduledAt: null }, { scheduledAt: { lte: now } }],
  };
}

export async function processQueuedMessageSends(
  options: ProcessQueuedMessageSendsOptions = {},
): Promise<ProcessQueuedMessageSendsResult> {
  const limit = Math.max(1, Math.min(100, options.limit ?? 25));
  const now = options.now ?? new Date();
  const claimTimeoutMs = options.claimTimeoutMs ?? 15 * 60 * 1000;

  await prisma.messageSend.updateMany({
    where: {
      status: "QUEUED",
      providerMessageId: { startsWith: "claim_" },
      updatedAt: { lt: new Date(now.getTime() - claimTimeoutMs) },
    },
    data: { providerMessageId: null },
  });

  const candidates = await prisma.messageSend.findMany({
    where: {
      status: "QUEUED",
      providerMessageId: null,
      ...getEligibleScheduledFilter(now),
    },
    orderBy: { createdAt: "asc" },
    take: limit,
  });

  if (candidates.length === 0) {
    return { processed: 0, delivered: 0, failed: 0 };
  }

  const claimId = `claim_${randomUUID()}`;
  await prisma.messageSend.updateMany({
    where: {
      id: { in: candidates.map((send) => send.id) },
      status: "QUEUED",
      providerMessageId: null,
    },
    data: { providerMessageId: claimId },
  });

  const claimed = await prisma.messageSend.findMany({
    where: { providerMessageId: claimId },
    orderBy: { createdAt: "asc" },
  });

  let delivered = 0;
  let failed = 0;

  for (const send of claimed) {
    try {
      let providerMessageId: string;

      if (send.channel === "EMAIL") {
        if (!send.subject) {
          throw new Error("Email send missing subject");
        }

        providerMessageId = await sendEmail({
          to: send.to,
          subject: send.subject,
          html: send.body,
          text: send.body,
        });
      } else {
        providerMessageId = await sendSms({ to: send.to, body: send.body });
      }

      await prisma.messageSend.update({
        where: { id: send.id },
        data: {
          status: "DELIVERED",
          providerMessageId,
          sentAt: now,
        },
      });

      await prisma.messageEvent.create({
        data: {
          orgId: send.orgId,
          messageSendId: send.id,
          eventType: "DELIVERED",
          providerEventId: providerMessageId,
          occurredAt: now,
        },
      });

      delivered += 1;
    } catch (error) {
      const message = error instanceof Error ? error.message : "send_failed";

      await prisma.messageSend.update({
        where: { id: send.id },
        data: {
          status: "FAILED",
          providerMessageId: null,
          sentAt: now,
        },
      });

      await prisma.messageEvent.create({
        data: {
          orgId: send.orgId,
          messageSendId: send.id,
          eventType: "FAILED",
          providerEventId: message.slice(0, 256),
          occurredAt: now,
        },
      });

      failed += 1;
    }
  }

  return { processed: claimed.length, delivered, failed };
}
