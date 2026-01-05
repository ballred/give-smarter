import { prisma } from "@/lib/db";
import { parseCsv } from "@/lib/csv";

function normalizeHeader(header: string) {
  return header.trim().toLowerCase();
}

export async function importAttendees(formData: FormData) {
  const campaignId = String(formData.get("campaignId") ?? "");
  const file = formData.get("file");

  if (!campaignId) {
    throw new Error("Campaign is required.");
  }

  if (!(file instanceof File)) {
    throw new Error("CSV file is required.");
  }

  const campaign = await prisma.campaign.findUnique({
    where: { id: campaignId },
    select: { orgId: true },
  });

  if (!campaign) {
    throw new Error("Campaign not found.");
  }

  const csvText = await file.text();
  const { headers, rows } = parseCsv(csvText);
  const headerMap = new Map(
    headers.map((header, index) => [normalizeHeader(header), index]),
  );

  const requiredHeaders = ["first_name", "last_name"];

  for (const required of requiredHeaders) {
    if (!headerMap.has(required)) {
      throw new Error(`Missing required header: ${required}`);
    }
  }

  const attendeeData = rows
    .map((row) => {
      const firstName = row[headerMap.get("first_name") ?? -1]?.trim();
      const lastName = row[headerMap.get("last_name") ?? -1]?.trim();
      const email = row[headerMap.get("email") ?? -1]?.trim();
      const phone = row[headerMap.get("phone") ?? -1]?.trim();
      const ticketTypeId = row[headerMap.get("ticket_type_id") ?? -1]?.trim();

      if (!firstName && !lastName) {
        return null;
      }

      return {
        orgId: campaign.orgId,
        campaignId,
        ticketTypeId: ticketTypeId || null,
        firstName: firstName || null,
        lastName: lastName || null,
        email: email || null,
        phone: phone || null,
        status: "REGISTERED" as const,
      };
    })
    .filter(Boolean) as {
    orgId: string;
    campaignId: string;
    ticketTypeId: string | null;
    firstName: string | null;
    lastName: string | null;
    email: string | null;
    phone: string | null;
    status: "REGISTERED";
  }[];

  if (!attendeeData.length) {
    return;
  }

  await prisma.attendee.createMany({
    data: attendeeData,
  });
}
