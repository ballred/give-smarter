import { prisma } from "@/lib/db";

function parseNumber(value: FormDataEntryValue | null) {
  if (!value) return null;
  const num = Number(value);
  return Number.isFinite(num) ? num : null;
}

export async function createAuctionCategory(
  auctionId: string,
  formData: FormData,
) {
  const name = String(formData.get("name") ?? "").trim();
  const description = String(formData.get("description") ?? "").trim();
  const sortOrderInput = parseNumber(formData.get("sortOrder"));

  if (!name) {
    throw new Error("Name is required.");
  }

  const auction = await prisma.auction.findUnique({
    where: { id: auctionId },
    select: { orgId: true },
  });

  if (!auction) {
    throw new Error("Auction not found.");
  }

  await prisma.auctionCategory.create({
    data: {
      orgId: auction.orgId,
      auctionId,
      name,
      description: description || null,
      sortOrder: sortOrderInput !== null ? sortOrderInput : 0,
    },
  });
}
