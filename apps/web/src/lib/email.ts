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

async function sendViaResend(message: EmailMessage) {
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

  if (!response.ok) {
    const detail = await response.text();
    throw new Error(`Resend error: ${detail}`);
  }
}

export async function sendEmail(message: EmailMessage) {
  const transport =
    (process.env.EMAIL_TRANSPORT ??
      (process.env.RESEND_API_KEY ? "resend" : "console")).toLowerCase();

  if (transport === "console") {
    console.info(`[email] to=${message.to} subject=${message.subject}`);
    if (message.text) {
      console.info(message.text);
    }
    return;
  }

  if (transport === "resend") {
    await sendViaResend(message);
    return;
  }

  throw new Error(`Unsupported EMAIL_TRANSPORT: ${transport}`);
}
