import nodemailer from 'nodemailer';
import { fetch, EnvHttpProxyAgent } from 'undici';
const dispatcher = new EnvHttpProxyAgent();
import { mkdir, writeFile } from 'node:fs/promises';
import { randomUUID } from 'node:crypto';
import { config } from './config.js';
import { HttpError } from './errors.js';
export const testMailbox: { to: string; subject: string; text: string }[] = [];
export const emailEnabled = config.MAIL_MODE === 'enabled';
export function requireEmail() {
  if (!emailEnabled)
    throw new HttpError(503, 'Email delivery is unavailable in this deployment.', 'EMAIL_DISABLED');
}
export async function sendMail(to: string, subject: string, text: string) {
  requireEmail();
  if (config.NODE_ENV === 'test') {
    testMailbox.push({ to, subject, text });
    return;
  }
  if (config.RESEND_API_KEY) {
    const result = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      dispatcher,
      headers: {
        'content-type': 'application/json',
        authorization: `Bearer ${config.RESEND_API_KEY}`,
      },
      body: JSON.stringify({ from: config.MAIL_FROM, to: [to], subject, text }),
      signal: AbortSignal.timeout(15000),
    });
    await result.body?.cancel();
    if (!result.ok)
      throw new Error(
        'Email provider rejected delivery. Check the sender domain and provider settings.',
      );
  } else if (config.SMTP_HOST) {
    const transport = nodemailer.createTransport({
      host: config.SMTP_HOST,
      port: config.SMTP_PORT,
      secure: config.SMTP_PORT === 465,
      requireTLS: config.SMTP_PORT !== 465,
      auth: config.SMTP_USER ? { user: config.SMTP_USER, pass: config.SMTP_PASS } : undefined,
    });
    await transport.sendMail({ from: config.MAIL_FROM, to, subject, text });
  } else {
    await mkdir('.local/mail', { recursive: true });
    const transport = nodemailer.createTransport({ streamTransport: true, buffer: true });
    const result = await transport.sendMail({ from: config.MAIL_FROM, to, subject, text });
    await writeFile(`.local/mail/${randomUUID()}.eml`, result.message, { mode: 0o600 });
  }
}
