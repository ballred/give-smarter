import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { prisma } from "@/lib/db";
import { toCsv } from "@/lib/csv";

export const runtime = "nodejs";

export async function GET(request: Request) {
  const { userId } = auth();

  if (!userId) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const url = new URL(request.url);
  const format = url.searchParams.get("format") ?? "json";

  const payments = await prisma.payment.findMany({
    include: {
      order: {
        include: {
          donor: true,
        },
      },
    },
    orderBy: { createdAt: "desc" },
  });

  if (format === "csv") {
    const headers = [
      "order_number",
      "payment_id",
      "donor_name",
      "amount_cents",
      "fee_cents",
      "net_cents",
      "status",
      "created_at",
    ];
    const rows = payments.map((payment) => [
      payment.order?.orderNumber ?? "",
      payment.id,
      payment.order?.donor?.displayName ??
        [payment.order?.donor?.firstName, payment.order?.donor?.lastName]
          .filter(Boolean)
          .join(" "),
      payment.amount,
      payment.feeAmount,
      payment.netAmount,
      payment.status,
      payment.createdAt.toISOString(),
    ]);

    return new NextResponse(toCsv(headers, rows), {
      headers: {
        "Content-Type": "text/csv",
        "Content-Disposition": "attachment; filename=finance-report.csv",
      },
    });
  }

  return NextResponse.json({ data: payments });
}
