import nodemailer from 'nodemailer';
import { env } from '../config/env.js';

let transporter = null;
if (env.smtpEnabled) {
  transporter = nodemailer.createTransport({
    host: env.SMTP_HOST,
    port: env.SMTP_PORT,
    secure: env.SMTP_PORT === 465,
    auth: env.SMTP_USER ? { user: env.SMTP_USER, pass: env.SMTP_PASS } : undefined,
  });
}

/**
 * Send an email via SMTP when configured; otherwise print it to the server
 * console (offline-friendly demo mode). Never throws.
 *
 * @param {{ to: string, subject: string, text: string, html?: string }} mail
 * @returns {Promise<{ delivered: boolean, via: 'smtp'|'console' }>}
 */
export async function sendMail({ to, subject, text, html }) {
  if (transporter) {
    try {
      await transporter.sendMail({ from: env.SMTP_FROM, to, subject, text, html });
      return { delivered: true, via: 'smtp' };
    } catch (err) {
      console.error('[mailer] SMTP send failed, falling back to console:', err.message);
    }
  }
  console.log('\n──────────── ✉  StockSense mail (console) ────────────');
  console.log(`To:      ${to}`);
  console.log(`Subject: ${subject}`);
  console.log(text);
  console.log('──────────────────────────────────────────────────────\n');
  return { delivered: false, via: 'console' };
}
