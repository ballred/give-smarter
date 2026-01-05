import { prisma } from "@/lib/db";

function parseNumber(value: FormDataEntryValue | null) {
  if (!value) return null;
  const num = Number(value);
  return Number.isFinite(num) ? num : null;
}

export async function createStoreVariant(
  productId: string,
  formData: FormData,
) {
  const name = String(formData.get("name") ?? "").trim();
  const sku = String(formData.get("sku") ?? "").trim();
  const priceInput = parseNumber(formData.get("price"));
  const inventoryInput = parseNumber(formData.get("inventoryCount"));

  if (!name) {
    throw new Error("Name is required.");
  }

  const product = await prisma.storeProduct.findUnique({
    where: { id: productId },
    select: { orgId: true },
  });

  if (!product) {
    throw new Error("Product not found.");
  }

  const variant = await prisma.storeVariant.create({
    data: {
      orgId: product.orgId,
      productId,
      name,
      sku: sku || null,
      price: priceInput !== null && priceInput > 0 ? Math.round(priceInput * 100) : null,
      inventoryCount:
        inventoryInput !== null && inventoryInput >= 0 ? inventoryInput : null,
    },
  });

  return variant.id;
}
