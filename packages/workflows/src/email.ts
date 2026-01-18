import { randomUUID } from "crypto";

export type EmailMessage = {
  to: string;
  subject: string;
  html: string;
  text?: string;
  from?: string;
};

type ResendPayload = {
  from: string;
  to: string;
  subject: string;
  html: string;
  text?: string;
};

type ResendResponse = {
  id: string;
};

async function sendViaResend(message: EmailMessage): Promise<string> {
  const apiKey = process.env.RESEND_API_KEY;
  const from = message.from ?? process.env.EMAIL_FROM;

  if (!apiKey) {
    throw new Error("RESEND_API_KEY is not set");
  }

  if (!from) {
    throw new Error("EMAIL_FROM is not set");
  }

  const payload: ResendPayload = {
    from,
    to: message.to,
    subject: message.subject,
    html: message.html,
    text: message.text,
  };

  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });

  const bodyText = await response.text();

  if (!response.ok) {
    throw new Error(`Resend error: ${bodyText}`);
  }

  const parsed = bodyText ? (JSON.parse(bodyText) as ResendResponse) : null;

  if (!parsed?.id) {
    throw new Error("Resend response missing id");
  }

  return parsed.id;
}

export async function sendEmail(message: EmailMessage): Promise<string> {
  const transport =
    (process.env.EMAIL_TRANSPORT ??
      (process.env.RESEND_API_KEY ? "resend" : "console")).toLowerCase();

  if (transport === "console") {
    const id = `console_${randomUUID()}`;
    console.info(`[email] id=${id} to=${message.to} subject=${message.subject}`);
    if (message.text) {
      console.info(message.text);
    }
    return id;
  }

  if (transport === "resend") {
    return sendViaResend(message);
  }

  throw new Error(`Unsupported EMAIL_TRANSPORT: ${transport}`);
}

