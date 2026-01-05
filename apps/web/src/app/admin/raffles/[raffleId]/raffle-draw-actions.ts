import { prisma } from "@/lib/db";

export async function drawRaffleWinner(raffleId: string) {
  const tickets = await prisma.raffleTicket.findMany({
    where: { raffleId },
  });

  const drawnAt = new Date();

  if (!tickets.length) {
    await prisma.raffleDraw.create({
      data: {
        orgId: await resolveOrgId(raffleId),
        raffleId,
        drawnAt,
        notes: "No tickets sold",
      },
    });
    return;
  }

  const winnerTicket = tickets[Math.floor(Math.random() * tickets.length)];

  await prisma.raffleDraw.create({
    data: {
      orgId: await resolveOrgId(raffleId),
      raffleId,
      drawnAt,
      winnerDonorId: winnerTicket.donorId ?? null,
    },
  });
}

async function resolveOrgId(raffleId: string) {
  const raffle = await prisma.raffle.findUnique({
    where: { id: raffleId },
    select: { orgId: true },
  });

  if (!raffle) {
    throw new Error("Raffle not found.");
  }

  return raffle.orgId;
}
