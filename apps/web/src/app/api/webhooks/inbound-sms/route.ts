import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export const runtime = "nodejs";

type InboundPayload = {
  From?: string;
  Body?: string;
  from?: string;
  body?: string;
};

function normalizeKeyword(input: string) {
  return input.trim().toUpperCase().replace(/\s+/g, "");
}

function resolveOrigin(request: Request) {
  const host = request.headers.get("host");
  if (!host) return "http://localhost:3000";
  const proto = request.headers.get("x-forwarded-proto") ?? "https";
  return `${proto}://${host}`;
}

async function parsePayload(request: Request): Promise<InboundPayload> {
  const contentType = request.headers.get("content-type") ?? "";

  if (contentType.includes("application/json")) {
    return (await request.json()) as InboundPayload;
  }

  const body = await request.text();
  const params = new URLSearchParams(body);

  return {
    From: params.get("From") ?? undefined,
    Body: params.get("Body") ?? undefined,
  };
}

function buildReply(
  template: string | null | undefined,
  link: string,
): string {
  if (!template) {
    return `Thanks for your support! Give here: ${link}`;
  }

  return template.replace(/{{\s*link\s*}}/gi, link);
}

export async function POST(request: Request) {
  let payload: InboundPayload;

  try {
    payload = await parsePayload(request);
  } catch {
    return NextResponse.json({ error: "invalid_payload" }, { status: 400 });
  }

  const message = payload.Body ?? payload.body ?? "";
  const keyword = normalizeKeyword(message.split(/\s+/)[0] ?? "");

  if (!keyword) {
    return NextResponse.json({ reply: "Please text a keyword to donate." });
  }

  const route = await prisma.keywordRoute.findFirst({
    where: { keyword, status: "ACTIVE" },
    include: { campaign: { select: { slug: true } } },
  });

  const origin = resolveOrigin(request);
  const campaignSlug = route?.campaign?.slug;
  const baseLink = campaignSlug
    ? `${origin}/campaigns/${campaignSlug}/donate`
    : `${origin}/campaigns`;
  const utm = new URLSearchParams({
    utm_source: "sms",
    utm_medium: "keyword",
    utm_campaign: campaignSlug ?? "text-to-give",
    keyword,
  });
  const link = `${baseLink}?${utm.toString()}`;
  const reply = buildReply(route?.replyMessage, link);

  return NextResponse.json({ reply });
}
