import nodemailer from 'nodemailer';
import { env } from '../config/env.js';

let transporter = null;
if (env.smtpEnabled) {
  transporter = nodemailer.createTransport({
    host: env.SMTP_HOST,
    port: env.SMTP_PORT,
    secure: env.SMTP_PORT === 465, // 465 = implicit TLS (Gmail), 587 = STARTTLS
    pool: true, // reuse connections — much faster when several mails go out
    maxConnections: 3,
    auth: env.SMTP_USER ? { user: env.SMTP_USER, pass: env.SMTP_PASS } : undefined,
  });
}

/**
 * Addresses that can never receive mail (seed/demo users like admin@stocksense.local).
 * Sending to them through Gmail only creates bounces, so they go to the console instead.
 */
const UNDELIVERABLE = /@([^@]+\.)?(local|localhost|test|example|invalid)$/i;

function printToConsole({ to, subject, text }, reason) {
  console.log(`\n──────────── ✉  StockSense mail (console${reason ? `: ${reason}` : ''}) ────────────`);
  console.log(`To:      ${to}`);
  console.log(`Subject: ${subject}`);
  console.log(text);
  console.log('──────────────────────────────────────────────────────\n');
}

/**
 * Check the SMTP login once at startup and log the result (never throws).
 * @returns {Promise<boolean>}
 */
export async function verifyMailer() {
  if (!transporter) {
    console.log('✉  SMTP not configured — emails (incl. OTP codes) will be printed to this console.');
    return false;
  }
  try {
    await transporter.verify();
    console.log(`✉  SMTP ready (${env.SMTP_HOST}:${env.SMTP_PORT} as ${env.SMTP_USER})`);
    return true;
  } catch (err) {
    console.error(`✉  SMTP login failed (${err.code || 'ERROR'}): ${err.message}. Falling back to console output.`);
    return false;
  }
}

/**
 * Send an email via SMTP when configured; otherwise (or on failure) print it to
 * the server console so the flow still works offline. Never throws.
 *
 * @param {{ to: string, subject: string, text: string, html?: string }} mail
 * @returns {Promise<{ delivered: boolean, via: 'smtp'|'console' }>}
 */
export async function sendMail({ to, subject, text, html }) {
  if (!to) return { delivered: false, via: 'console' };

  if (transporter && !UNDELIVERABLE.test(to)) {
    try {
      await transporter.sendMail({ from: env.SMTP_FROM, to, subject, text, html });
      if (env.isDev) console.log(`✉  sent "${subject}" → ${to}`);
      return { delivered: true, via: 'smtp' };
    } catch (err) {
      console.error(`[mailer] SMTP send to ${to} failed (${err.code || 'ERROR'}): ${err.message}`);
      printToConsole({ to, subject, text }, 'SMTP failed');
      return { delivered: false, via: 'console' };
    }
  }

  printToConsole({ to, subject, text }, transporter ? 'demo address' : '');
  return { delivered: false, via: 'console' };
}

/**
 * Fire-and-forget: send a template result without delaying the HTTP response.
 * Use for notifications (welcome, login alert, password changed...).
 * For the OTP email use `await sendMail(...)` so the code is out before we reply.
 *
 * @param {string} to
 * @param {{ subject: string, html: string, text: string }} message output of an emailTemplates builder
 */
export function queueMail(to, message) {
  sendMail({ to, ...message }).catch((err) => console.error('[mailer] queue error', err));
}
