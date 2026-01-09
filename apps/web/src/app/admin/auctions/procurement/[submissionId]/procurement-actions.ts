"use server";

import { prisma } from "@/lib/db";
import { ProcurementStatus } from "@prisma/client";
import { revalidatePath } from "next/cache";

export async function updateProcurementSubmission(
  submissionId: string,
  formData: FormData,
) {
  const status = formData.get("status") as ProcurementStatus;
  const itemTitle = String(formData.get("itemTitle") ?? "").trim() || null;
  const notes = String(formData.get("notes") ?? "").trim() || null;

  await prisma.procurementSubmission.update({
    where: { id: submissionId },
    data: {
      status,
      itemTitle,
      notes,
    },
  });

  revalidatePath(`/admin/auctions/procurement/${submissionId}`);
}
