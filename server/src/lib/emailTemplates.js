import { env } from '../config/env.js';

/*
 * Transactional email templates.
 *
 * Email clients (Gmail, Outlook, Apple Mail) ignore <style> blocks and modern CSS,
 * so every template is table-based with inline styles only. Colours follow
 * docs/DESIGN.md (teal primary, zinc neutrals, amber/rose for warnings).
 *
 * Every builder returns { subject, html, text } — always pass the plain-text
 * version too; it is used by clients that block HTML and by the console fallback.
 */

const C = {
  brand: '#0D9488',
  brandDark: '#0F766E',
  brandSoft: '#F0FDFA',
  text: '#18181B',
  muted: '#71717A',
  border: '#E4E4E7',
  bg: '#F4F4F5',
  card: '#FFFFFF',
  amberSoft: '#FFFBEB',
  amber: '#B45309',
  roseSoft: '#FFF1F2',
  rose: '#BE123C',
  emeraldSoft: '#ECFDF5',
  emerald: '#047857',
};

const FONT = "'Inter','Segoe UI',Roboto,Helvetica,Arial,sans-serif";
const MONO = "'JetBrains Mono','SFMono-Regular',Consolas,'Liberation Mono',monospace";

/** Escape user-supplied text before inserting it into HTML. */
export function esc(value) {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

const appUrl = (path = '') => `${env.CLIENT_URL.replace(/\/$/, '')}${path}`;

const formatDate = (date = new Date()) =>
  new Intl.DateTimeFormat('en-IN', { dateStyle: 'medium', timeStyle: 'short', timeZone: 'Asia/Kolkata' }).format(date) + ' IST';

// ───────────────────────────── building blocks ─────────────────────────────

function button(label, href, color = C.brand) {
  return `
  <table role="presentation" cellpadding="0" cellspacing="0" border="0" style="margin:24px 0 8px;">
    <tr><td align="center" bgcolor="${color}" style="border-radius:8px;">
      <a href="${esc(href)}" target="_blank"
         style="display:inline-block;padding:12px 24px;font-family:${FONT};font-size:14px;font-weight:600;color:#ffffff;text-decoration:none;border-radius:8px;">
        ${esc(label)}
      </a>
    </td></tr>
  </table>`;
}

function paragraph(html) {
  return `<p style="margin:0 0 14px;font-family:${FONT};font-size:14px;line-height:22px;color:${C.text};">${html}</p>`;
}

/** Key/value details table, e.g. [['Login ID', 'admin01'], ...]. Values are escaped. */
function details(rows) {
  const body = rows
    .map(
      ([k, v], i) => `
      <tr>
        <td style="padding:10px 14px;font-family:${FONT};font-size:13px;color:${C.muted};width:40%;${i ? `border-top:1px solid ${C.border};` : ''}">${esc(k)}</td>
        <td style="padding:10px 14px;font-family:${MONO};font-size:13px;color:${C.text};font-weight:600;${i ? `border-top:1px solid ${C.border};` : ''}">${esc(v)}</td>
      </tr>`,
    )
    .join('');
  return `
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0"
         style="margin:8px 0 18px;border:1px solid ${C.border};border-radius:10px;border-collapse:separate;background:#FAFAFA;">
    ${body}
  </table>`;
}

/** Coloured callout box. tone: info | warning | danger | success */
function callout(html, tone = 'info') {
  const tones = {
    info: [C.brandSoft, C.brandDark],
    warning: [C.amberSoft, C.amber],
    danger: [C.roseSoft, C.rose],
    success: [C.emeraldSoft, C.emerald],
  };
  const [bg, fg] = tones[tone] ?? tones.info;
  return `
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="margin:6px 0 18px;">
    <tr><td style="background:${bg};border-left:4px solid ${fg};border-radius:8px;padding:12px 14px;font-family:${FONT};font-size:13px;line-height:20px;color:${fg};">
      ${html}
    </td></tr>
  </table>`;
}

/** Six separate digit boxes for an OTP. */
function otpBoxes(otp) {
  const cells = String(otp)
    .split('')
    .map(
      (d) => `
      <td style="padding:0 4px;">
        <div style="width:44px;height:54px;line-height:54px;text-align:center;font-family:${MONO};font-size:26px;font-weight:700;color:${C.brandDark};background:${C.brandSoft};border:2px solid ${C.brand};border-radius:10px;">${esc(d)}</div>
      </td>`,
    )
    .join('');
  return `
  <table role="presentation" cellpadding="0" cellspacing="0" border="0" align="center" style="margin:22px auto 10px;">
    <tr>${cells}</tr>
  </table>`;
}

function badge(label, color = C.brand) {
  return `<span style="display:inline-block;padding:3px 10px;border-radius:999px;background:${color};color:#fff;font-family:${FONT};font-size:12px;font-weight:600;">${esc(label)}</span>`;
}

/**
 * Wrap content in the shared layout: preheader, branded header, white card, footer.
 * @param {{ title: string, preheader: string, body: string, accent?: string }} opts
 */
function layout({ title, preheader, body, accent = C.brand }) {
  return `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width,initial-scale=1">
  <meta name="color-scheme" content="light">
  <title>${esc(title)}</title>
</head>
<body style="margin:0;padding:0;background:${C.bg};-webkit-font-smoothing:antialiased;">
  <div style="display:none;max-height:0;overflow:hidden;opacity:0;color:transparent;">${esc(preheader)}</div>
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background:${C.bg};">
    <tr><td align="center" style="padding:32px 12px;">
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="max-width:560px;">

        <!-- Brand header -->
        <tr><td style="padding:0 4px 16px;">
          <table role="presentation" cellpadding="0" cellspacing="0" border="0"><tr>
            <td style="width:36px;height:36px;background:${C.brand};border-radius:9px;text-align:center;vertical-align:middle;font-family:${FONT};font-size:18px;font-weight:800;color:#fff;">S</td>
            <td style="padding-left:10px;font-family:${FONT};font-size:18px;font-weight:700;color:${C.text};">Stock<span style="color:${C.brand};">Sense</span></td>
          </tr></table>
        </td></tr>

        <!-- Card -->
        <tr><td style="background:${C.card};border:1px solid ${C.border};border-radius:14px;overflow:hidden;">
          <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
            <tr><td style="height:5px;background:${accent};font-size:0;line-height:0;">&nbsp;</td></tr>
            <tr><td style="padding:30px 32px 26px;">
              <h1 style="margin:0 0 16px;font-family:${FONT};font-size:22px;line-height:30px;font-weight:700;color:${C.text};">${esc(title)}</h1>
              ${body}
            </td></tr>
          </table>
        </td></tr>

        <!-- Footer -->
        <tr><td style="padding:20px 8px 0;text-align:center;font-family:${FONT};font-size:12px;line-height:18px;color:${C.muted};">
          You received this email because of activity on your StockSense account.<br>
          If this wasn't you, contact your administrator immediately.<br>
          <a href="${esc(appUrl('/'))}" style="color:${C.brand};text-decoration:none;font-weight:600;">Open StockSense</a>
          &nbsp;•&nbsp; Real-time inventory management
        </td></tr>

      </table>
    </td></tr>
  </table>
</body>
</html>`;
}

const ROLE_COLOR = { ADMIN: '#7C3AED', MANAGER: '#0369A1', STAFF: '#52525B' };

// ───────────────────────────── templates ─────────────────────────────

/** Sent after sign-up. */
export function welcomeEmail({ name, loginId, email, role = 'STAFF' }) {
  return {
    subject: 'Welcome to StockSense 🎉',
    html: layout({
      title: `Welcome aboard, ${name}!`,
      preheader: 'Your StockSense account is ready.',
      body:
        paragraph('Your StockSense account has been created. You can now track receipts, deliveries, transfers and stock in real time.') +
        details([
          ['Name', name],
          ['Login ID', loginId],
          ['Email', email],
          ['Role', role],
          ['Created', formatDate()],
        ]) +
        callout('New accounts start with the <b>Staff</b> role. An administrator can grant Manager or Admin access.', 'info') +
        button('Go to Dashboard', appUrl('/dashboard')),
    }),
    text: `Welcome to StockSense, ${name}!\n\nLogin ID: ${loginId}\nEmail: ${email}\nRole: ${role}\n\nSign in: ${appUrl('/login')}`,
  };
}

/** Sent on every successful login (security notification). */
export function loginAlertEmail({ name, loginId, ip, userAgent, at = new Date() }) {
  return {
    subject: 'New sign-in to your StockSense account',
    html: layout({
      title: 'New sign-in detected',
      preheader: `Signed in as ${loginId} on ${formatDate(at)}`,
      body:
        paragraph(`Hi ${esc(name)}, we noticed a new sign-in to your account.`) +
        details([
          ['Login ID', loginId],
          ['Time', formatDate(at)],
          ['IP address', ip || 'Unknown'],
          ['Device', (userAgent || 'Unknown').slice(0, 90)],
        ]) +
        callout("If this was you, no action is needed. If you don't recognise it, <b>reset your password now</b>.", 'warning') +
        button('Reset password', appUrl('/forgot-password'), C.amber),
    }),
    text: `New sign-in to StockSense\nLogin ID: ${loginId}\nTime: ${formatDate(at)}\nIP: ${ip || 'Unknown'}\nDevice: ${userAgent || 'Unknown'}\n\nNot you? Reset your password: ${appUrl('/forgot-password')}`,
  };
}

/** OTP for password reset. */
export function otpEmail({ name, otp, minutes = 10, maxAttempts = 5 }) {
  return {
    subject: `${otp} is your StockSense verification code`,
    html: layout({
      title: 'Reset your password',
      preheader: `Your verification code is ${otp}. It expires in ${minutes} minutes.`,
      body:
        paragraph(`Hi ${esc(name)}, use this code to reset your StockSense password:`) +
        otpBoxes(otp) +
        `<p style="margin:0 0 20px;text-align:center;font-family:${FONT};font-size:12px;color:${C.muted};">Expires in <b>${minutes} minutes</b> • max ${maxAttempts} attempts</p>` +
        callout('Never share this code with anyone. StockSense staff will <b>never</b> ask for it.', 'danger') +
        paragraph(`<span style="color:${C.muted};font-size:13px;">Didn't request a reset? You can safely ignore this email — your password will not change.</span>`),
      accent: C.brandDark,
    }),
    text: `Your StockSense password reset code is: ${otp}\nIt expires in ${minutes} minutes (max ${maxAttempts} attempts).\nNever share this code. If you did not request it, ignore this email.`,
  };
}

/** After a successful OTP reset. */
export function passwordResetSuccessEmail({ name, loginId, ip, at = new Date() }) {
  return {
    subject: 'Your StockSense password was reset',
    html: layout({
      title: 'Password reset successful',
      preheader: 'Your password has been changed using a verification code.',
      body:
        paragraph(`Hi ${esc(name)},`) +
        callout('✔ Your password was reset successfully. You can now sign in with your new password.', 'success') +
        details([
          ['Login ID', loginId],
          ['Time', formatDate(at)],
          ['IP address', ip || 'Unknown'],
        ]) +
        callout("Didn't do this? Contact your administrator immediately — someone may have access to your email.", 'danger') +
        button('Sign in', appUrl('/login')),
      accent: C.emerald,
    }),
    text: `Your StockSense password (${loginId}) was reset on ${formatDate(at)}.\nIf this wasn't you, contact your administrator immediately.\nSign in: ${appUrl('/login')}`,
  };
}

/** After changing the password from the profile page. */
export function passwordChangedEmail({ name, loginId, ip, at = new Date() }) {
  return {
    subject: 'Your StockSense password was changed',
    html: layout({
      title: 'Password changed',
      preheader: 'Your account password was just updated.',
      body:
        paragraph(`Hi ${esc(name)}, the password for your account was changed from your profile.`) +
        details([
          ['Login ID', loginId],
          ['Time', formatDate(at)],
          ['IP address', ip || 'Unknown'],
        ]) +
        callout("If you didn't make this change, reset your password immediately.", 'warning') +
        button('Reset password', appUrl('/forgot-password'), C.amber),
      accent: C.amber,
    }),
    text: `The password for ${loginId} was changed on ${formatDate(at)}.\nNot you? Reset it: ${appUrl('/forgot-password')}`,
  };
}

/**
 * After profile details change. When the email changes, send to BOTH addresses
 * (the old one is warned, the new one is confirmed).
 */
export function profileUpdatedEmail({ name, loginId, changes, toOldAddress = false }) {
  const rows = changes.map(({ field, from, to }) => [field, `${from || '—'} → ${to || '—'}`]);
  return {
    subject: toOldAddress ? 'Your StockSense email address was changed' : 'Your StockSense profile was updated',
    html: layout({
      title: toOldAddress ? 'Email address changed' : 'Profile updated',
      preheader: `Changes to ${loginId}: ${changes.map((c) => c.field).join(', ')}`,
      body:
        paragraph(`Hi ${esc(name)}, the following details on your account (<b>${esc(loginId)}</b>) were updated:`) +
        details(rows) +
        (toOldAddress
          ? callout('Future notifications will go to the new address. If you did not request this, contact your administrator.', 'warning')
          : callout('If you did not make these changes, contact your administrator.', 'info')) +
        button('View profile', appUrl('/profile')),
    }),
    text: `Profile updated for ${loginId}:\n${rows.map(([k, v]) => `- ${k}: ${v}`).join('\n')}\n\n${appUrl('/profile')}`,
  };
}

/** When an administrator changes a user's role or activation status. */
export function accountChangedByAdminEmail({ name, loginId, adminName, fromRole, toRole, fromActive, toActive }) {
  const rows = [];
  if (toRole && toRole !== fromRole) rows.push(['Role', `${fromRole} → ${toRole}`]);
  if (toActive !== undefined && toActive !== fromActive) rows.push(['Status', `${fromActive ? 'Active' : 'Inactive'} → ${toActive ? 'Active' : 'Inactive'}`]);
  rows.push(['Changed by', adminName], ['Time', formatDate()]);

  const deactivated = toActive === false && fromActive !== false;
  const reactivated = toActive === true && fromActive === false;
  const roleLine = toRole && toRole !== fromRole ? `<p style="margin:0 0 14px;">${badge(fromRole, ROLE_COLOR[fromRole])} &nbsp;→&nbsp; ${badge(toRole, ROLE_COLOR[toRole])}</p>` : '';

  return {
    subject: deactivated
      ? 'Your StockSense account has been deactivated'
      : reactivated
        ? 'Your StockSense account has been reactivated'
        : 'Your StockSense access has been updated',
    html: layout({
      title: deactivated ? 'Account deactivated' : reactivated ? 'Account reactivated' : 'Access updated',
      preheader: `An administrator updated your account ${loginId}.`,
      body:
        paragraph(`Hi ${esc(name)}, an administrator updated your account <b>${esc(loginId)}</b>.`) +
        roleLine +
        details(rows) +
        (deactivated
          ? callout('You can no longer sign in. Contact your administrator if you think this is a mistake.', 'danger')
          : callout('The change is effective immediately — refresh StockSense to see your new permissions.', 'success')) +
        (deactivated ? '' : button('Open StockSense', appUrl('/dashboard'))),
      accent: deactivated ? C.rose : C.brand,
    }),
    text: `Your StockSense account ${loginId} was updated by ${adminName}:\n${rows.map(([k, v]) => `- ${k}: ${v}`).join('\n')}`,
  };
}
