import { randomUUID } from "crypto";

export type SmsMessage = {
  to: string;
  body: string;
  from?: string;
};

type TwilioMessageResponse = {
  sid?: string;
  message?: string;
};

function getSmsTransport() {
  const hasTwilioCreds = Boolean(
    process.env.TWILIO_ACCOUNT_SID &&
      process.env.TWILIO_AUTH_TOKEN &&
      process.env.TWILIO_FROM_NUMBER,
  );

  return (
    process.env.SMS_TRANSPORT ?? (hasTwilioCreds ? "twilio" : "console")
  ).toLowerCase();
}

async function sendViaTwilio(message: SmsMessage): Promise<string> {
  const accountSid = process.env.TWILIO_ACCOUNT_SID;
  const authToken = process.env.TWILIO_AUTH_TOKEN;
  const from = message.from ?? process.env.TWILIO_FROM_NUMBER;

  if (!accountSid) {
    throw new Error("TWILIO_ACCOUNT_SID is not set");
  }

  if (!authToken) {
    throw new Error("TWILIO_AUTH_TOKEN is not set");
  }

  if (!from) {
    throw new Error("TWILIO_FROM_NUMBER is not set");
  }

  const url = `https://api.twilio.com/2010-04-01/Accounts/${accountSid}/Messages.json`;
  const params = new URLSearchParams({
    From: from,
    To: message.to,
    Body: message.body,
  });

  const response = await fetch(url, {
    method: "POST",
    headers: {
      Authorization: `Basic ${Buffer.from(
        `${accountSid}:${authToken}`,
        "utf-8",
      ).toString("base64")}`,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: params.toString(),
  });

  const bodyText = await response.text();

  if (!response.ok) {
    throw new Error(`Twilio error: ${bodyText}`);
  }

  const parsed = bodyText
    ? (JSON.parse(bodyText) as TwilioMessageResponse)
    : null;

  if (!parsed?.sid) {
    throw new Error("Twilio response missing sid");
  }

  return parsed.sid;
}

export async function sendSms(message: SmsMessage): Promise<string> {
  const transport = getSmsTransport();

  if (transport === "console") {
    const id = `console_${randomUUID()}`;
    console.info(`[sms] id=${id} to=${message.to}`);
    console.info(message.body);
    return id;
  }

  if (transport === "twilio") {
    return sendViaTwilio(message);
  }

  throw new Error(`Unsupported SMS_TRANSPORT: ${transport}`);
}

