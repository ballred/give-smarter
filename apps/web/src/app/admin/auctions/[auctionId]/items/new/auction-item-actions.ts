import { AuctionItemStatus } from "@prisma/client";
import { prisma } from "@/lib/db";

function parseNumber(value: FormDataEntryValue | null) {
  if (!value) return null;
  const num = Number(value);
  return Number.isFinite(num) ? num : null;
}

export async function createAuctionItem(
  auctionId: string,
  formData: FormData,
) {
  const title = String(formData.get("title") ?? "").trim();
  const description = String(formData.get("description") ?? "").trim();
  const startingBidInput = parseNumber(formData.get("startingBid"));
  const buyNowInput = parseNumber(formData.get("buyNowPrice"));
  const quantityInput = parseNumber(formData.get("quantity"));
  const fmvInput = parseNumber(formData.get("fmvAmount"));
  const categoryId = String(formData.get("categoryId") ?? "").trim();
  const statusInput = String(formData.get("status") ?? "DRAFT");
  const fulfillmentMethod = String(
    formData.get("fulfillmentMethod") ?? "",
  ).trim();
  const isFeatured = formData.get("isFeatured") === "on";
  const isPreviewOnly = formData.get("isPreviewOnly") === "on";

  if (!title) {
    throw new Error("Title is required.");
  }

  if (startingBidInput === null || startingBidInput < 0) {
    throw new Error("Starting bid must be valid.");
  }

  const auction = await prisma.auction.findUnique({
    where: { id: auctionId },
    select: { orgId: true },
  });

  if (!auction) {
    throw new Error("Auction not found.");
  }

  const status =
    statusInput === AuctionItemStatus.PUBLISHED
      ? AuctionItemStatus.PUBLISHED
      : AuctionItemStatus.DRAFT;

  const item = await prisma.auctionItem.create({
    data: {
      orgId: auction.orgId,
      auctionId,
      categoryId: categoryId || null,
      title,
      description: description || null,
      startingBid: Math.round(startingBidInput * 100),
      buyNowPrice:
        buyNowInput !== null && buyNowInput > 0
          ? Math.round(buyNowInput * 100)
          : null,
      quantity: quantityInput !== null && quantityInput > 0 ? quantityInput : 1,
      fmvAmount: fmvInput !== null && fmvInput > 0 ? Math.round(fmvInput * 100) : 0,
      fulfillmentMethod: fulfillmentMethod || null,
      status,
      isFeatured,
      isPreviewOnly,
    },
  });

  return item.id;
}
