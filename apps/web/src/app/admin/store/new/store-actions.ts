import { StoreProductStatus } from "@prisma/client";
import { prisma } from "@/lib/db";

function parseNumber(value: FormDataEntryValue | null) {
  if (!value) return null;
  const num = Number(value);
  return Number.isFinite(num) ? num : null;
}

export async function createStoreProduct(formData: FormData) {
  const campaignId = String(formData.get("campaignId") ?? "");
  const name = String(formData.get("name") ?? "").trim();
  const description = String(formData.get("description") ?? "").trim();
  const priceInput = parseNumber(formData.get("price"));
  const sku = String(formData.get("sku") ?? "").trim();
  const inventoryInput = parseNumber(formData.get("inventoryCount"));
  const shippingRequired = formData.get("shippingRequired") === "on";
  const statusInput = String(formData.get("status") ?? "ACTIVE");

  if (!campaignId) {
    throw new Error("Campaign is required.");
  }

  if (!name) {
    throw new Error("Name is required.");
  }

  if (priceInput === null || priceInput < 0) {
    throw new Error("Price must be valid.");
  }

  const campaign = await prisma.campaign.findUnique({
    where: { id: campaignId },
    select: { orgId: true },
  });

  if (!campaign) {
    throw new Error("Campaign not found.");
  }

  const status =
    statusInput === StoreProductStatus.INACTIVE
      ? StoreProductStatus.INACTIVE
      : StoreProductStatus.ACTIVE;

  const product = await prisma.storeProduct.create({
    data: {
      orgId: campaign.orgId,
      campaignId,
      name,
      description: description || null,
      price: Math.round(priceInput * 100),
      currency: "USD",
      sku: sku || null,
      inventoryCount:
        inventoryInput !== null && inventoryInput >= 0 ? inventoryInput : null,
      shippingRequired,
      status,
    },
  });

  return product.id;
}
