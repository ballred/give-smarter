import { NextResponse } from "next/server";
import { processQueuedMessageSends } from "@give-smarter/workflows";

export const runtime = "nodejs";

function isAuthorized(request: Request) {
  const secret = process.env.CRON_SECRET;
  if (!secret) return true;

  const header = request.headers.get("authorization") ?? "";
  const token = header.startsWith("Bearer ") ? header.slice(7) : null;

  return token === secret;
}

export async function GET(request: Request) {
  if (!isAuthorized(request)) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const url = new URL(request.url);
  const limit = url.searchParams.get("limit");
  const parsedLimit = limit ? Number.parseInt(limit, 10) : undefined;

  const result = await processQueuedMessageSends({
    limit: parsedLimit && Number.isFinite(parsedLimit) ? parsedLimit : undefined,
  });

  return NextResponse.json({ data: result });
}

