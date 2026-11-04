import 'dotenv/config';
import { z } from 'zod';
const schema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  PORT: z.coerce.number().default(4000),
  MONGODB_URI: z.string().default('mongodb://127.0.0.1:27017/nexora'),
  JWT_SECRET: z.string().min(32).default('local-development-only-change-this-secret-32'),
  WEB_URL: z.url().default('http://localhost:3000'),
  AI_BASE_URL: z.url().default('https://api.openai.com/v1'),
  AI_API_KEY: z.string().optional(),
  AI_MODEL: z.string().default('gpt-4o-mini'),
  SMTP_HOST: z.string().optional(),
  SMTP_PORT: z.coerce.number().default(587),
  SMTP_USER: z.string().optional(),
  SMTP_PASS: z.string().optional(),
  MAIL_FROM: z.string().default('Nexora <hello@nexora.local>'),
  CONTACT_EMAIL: z.email().default('contact@nexora.local'),
  RESEND_API_KEY: z.string().optional(),
  TRUST_PROXY: z.coerce.number().int().min(0).default(0),
});
export const config = schema.parse(process.env);
if (config.NODE_ENV === 'production') {
  if (config.JWT_SECRET.startsWith('local-development'))
    throw new Error('Set a unique JWT_SECRET in production');
  if (!process.env.MONGODB_URI) throw new Error('MONGODB_URI is required in production');
  if (!config.WEB_URL.startsWith('https://'))
    throw new Error('WEB_URL must use HTTPS in production');
  if (!config.SMTP_HOST && !config.RESEND_API_KEY)
    throw new Error('Configure SMTP_HOST or RESEND_API_KEY in production for account recovery');
}
