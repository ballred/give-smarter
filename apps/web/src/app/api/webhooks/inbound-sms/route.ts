import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { createHmac, timingSafeEqual } from "crypto";

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

function escapeXml(input: string) {
  return input
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

function resolveOrigin(request: Request) {
  const host = request.headers.get("host");
  if (!host) return "http://localhost:3000";
  const proto = request.headers.get("x-forwarded-proto") ?? "https";
  return `${proto}://${host}`;
}

type ParsedPayload = {
  payload: InboundPayload;
  params: Record<string, string>;
};

async function parsePayload(request: Request): Promise<ParsedPayload> {
  const contentType = request.headers.get("content-type") ?? "";

  if (contentType.includes("application/json")) {
    return {
      payload: (await request.json()) as InboundPayload,
      params: {},
    };
  }

  const body = await request.text();
  const params = new URLSearchParams(body);
  const paramsObject: Record<string, string> = {};

  for (const [key, value] of params.entries()) {
    paramsObject[key] = value;
  }

  return {
    payload: {
      From: params.get("From") ?? undefined,
      Body: params.get("Body") ?? undefined,
    },
    params: paramsObject,
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

function computeTwilioSignature(
  url: string,
  params: Record<string, string>,
  authToken: string,
) {
  const serialized = Object.keys(params)
    .sort()
    .map((key) => `${key}${params[key] ?? ""}`)
    .join("");

  return createHmac("sha1", authToken).update(url + serialized).digest("base64");
}

function shouldValidateTwilioSignature() {
  const configured = (process.env.TWILIO_VALIDATE_SIGNATURE ?? "").toLowerCase();

  if (configured === "false") {
    return false;
  }
  if (configured === "true") {
    return true;
  }

  return Boolean(process.env.TWILIO_AUTH_TOKEN);
}

export async function POST(request: Request) {
  let parsed: ParsedPayload;

  try {
    parsed = await parsePayload(request);
  } catch {
    return NextResponse.json({ error: "invalid_payload" }, { status: 400 });
  }

  if (shouldValidateTwilioSignature()) {
    const signature = request.headers.get("x-twilio-signature");
    const authToken = process.env.TWILIO_AUTH_TOKEN;

    if (!signature || !authToken) {
      return NextResponse.json(
        { error: "signature_required" },
        { status: 401 },
      );
    }

    const origin = resolveOrigin(request);
    const url = new URL(request.url);
    const fullUrl = `${origin}${url.pathname}${url.search}`;
    const expected = computeTwilioSignature(fullUrl, parsed.params, authToken);

    try {
      const left = Buffer.from(expected);
      const right = Buffer.from(signature);
      if (left.length !== right.length || !timingSafeEqual(left, right)) {
        return NextResponse.json({ error: "invalid_signature" }, { status: 401 });
      }
    } catch {
      return NextResponse.json({ error: "invalid_signature" }, { status: 401 });
    }
  }

  const payload = parsed.payload;
  const message = payload.Body ?? payload.body ?? "";
  const keyword = normalizeKeyword(message.split(/\s+/)[0] ?? "");

  if (!keyword) {
    const twiml = `<?xml version="1.0" encoding="UTF-8"?><Response><Message>${escapeXml(
      "Please text a keyword to donate.",
    )}</Message></Response>`;
    return new NextResponse(twiml, {
      headers: { "content-type": "text/xml; charset=utf-8" },
    });
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

  const twiml = `<?xml version="1.0" encoding="UTF-8"?><Response><Message>${escapeXml(
    reply,
  )}</Message></Response>`;

  return new NextResponse(twiml, {
    headers: { "content-type": "text/xml; charset=utf-8" },
  });
}
