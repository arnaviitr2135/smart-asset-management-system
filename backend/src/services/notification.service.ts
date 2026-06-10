import { PrismaClient } from '@prisma/client';
import * as nodemailer from 'nodemailer';

const prisma = new PrismaClient();

const readEnv = (...keys: string[]) => {
  for (const key of keys) {
    const value = process.env[key]?.trim();
    if (value) return value;
  }
  return '';
};

const maskEmail = (email: string) => {
  const [name, domain] = email.split('@');
  if (!name || !domain) return 'configured';
  return `${name.slice(0, 2)}***@${domain}`;
};

const smtpUser = readEnv('SMTP_USER', 'SMTP_USERNAME', 'SMTP_EMAIL', 'EMAIL_USER', 'SMTP-user');
const smtpPass = readEnv('SMTP_PASS', 'SMTP_PASSWORD', 'EMAIL_PASS', 'SMTP-pass').replace(/\s+/g, '');
const resendApiKey = readEnv('RESEND_API_KEY');
const resendFrom = readEnv('RESEND_FROM') || (smtpUser ? `CultTrack AI <${smtpUser}>` : 'CultTrack AI <onboarding@resend.dev>');
const isHostedRuntime = Boolean(process.env.RENDER || process.env.RENDER_SERVICE_ID || process.env.NODE_ENV === 'production');

// Transporter: Gmail in configured environments, Ethereal only for local development without credentials.
let transporterPromise = (async () => {
  if (resendApiKey) {
    console.log(`[Resend] API email provider configured with from: ${resendFrom}`);
    return null;
  }

  if (smtpUser && smtpPass) {
    try {
      const transport = nodemailer.createTransport({
        service: 'gmail',
        auth: {
          user: smtpUser,
          pass: smtpPass,
        },
      });

      await transport.verify();
      console.log(`[SMTP] Gmail SMTP connected as: ${maskEmail(smtpUser)}`);
      console.log('[SMTP] Emails will be delivered to REAL inboxes.');
      return transport;
    } catch (err) {
      console.error('[SMTP Error] Gmail auth failed. Real emails will NOT be delivered until SMTP_USER/SMTP_PASS are fixed.', err);
      return null;
    }
  }

  console.log('[SMTP] Missing SMTP_USER or SMTP_PASS. Real emails will NOT be delivered.');
  if (isHostedRuntime) {
    console.log('[SMTP] Add SMTP_USER and SMTP_PASS in Render Environment, then redeploy/restart.');
    return null;
  }

  try {
    const account = await nodemailer.createTestAccount();
    console.log(`[SMTP] Local Ethereal test inbox: ${account.user}`);
    return nodemailer.createTransport({
      host: account.smtp.host,
      port: account.smtp.port,
      secure: account.smtp.secure,
      auth: {
        user: account.user,
        pass: account.pass,
      },
    });
  } catch (err) {
    console.error('[SMTP Error] Ethereal also failed, emails will only log to console.', err);
    return null;
  }
})();

function buildEmailHtml(
  recipientName: string,
  title: string,
  body: string,
  badge?: { label: string; color: string }
): string {
  const badgeHtml = badge
    ? `<p style="margin-top:10px;">
         <span style="display:inline-block;padding:4px 12px;border-radius:20px;
           background:${badge.color};color:#fff;font-size:12px;font-weight:bold;
           letter-spacing:1px;text-transform:uppercase">${badge.label}</span>
       </p>`
    : '';

  return `
    <div style="font-family:'Segoe UI',Arial,sans-serif;background:#0f1015;padding:0;margin:0;">
      <div style="max-width:560px;margin:40px auto;background:#1a1c23;border-radius:16px;
        overflow:hidden;border:1px solid #2b2e3a;box-shadow:0 8px 32px rgba(0,0,0,0.5);">

        <div style="background:linear-gradient(135deg,#7c3aed,#4f46e5);padding:28px 32px;">
          <h1 style="margin:0;font-size:20px;font-weight:700;color:#fff;letter-spacing:-0.5px;">
            CultTrack <span style="color:#c4b5fd;">AI</span>
          </h1>
          <p style="margin:4px 0 0;font-size:11px;color:rgba(255,255,255,0.6);
            text-transform:uppercase;letter-spacing:2px;">IIT Roorkee Cultural Council</p>
        </div>

        <div style="padding:28px 32px;color:#e2e4ea;">
          <p style="margin:0 0 8px;font-size:14px;color:#9ca3af;">Hello,</p>
          <p style="margin:0 0 16px;font-size:16px;font-weight:600;color:#fff;">${recipientName}</p>

          <div style="background:#262932;border-left:4px solid #7c3aed;border-radius:0 8px 8px 0;
            padding:16px 20px;margin:16px 0;">
            <p style="margin:0;font-size:14px;color:#d1d5db;line-height:1.7;">${body}</p>
          </div>

          ${badgeHtml}
        </div>

        <div style="padding:16px 32px;border-top:1px solid #2b2e3a;background:#12141a;">
          <p style="margin:0;font-size:11px;color:#4b5563;text-align:center;">
            This is an automated message from CultTrack AI. Please do not reply directly.
          </p>
        </div>
      </div>
    </div>
  `;
}

async function sendEmail(
  to: string,
  recipientName: string,
  subject: string,
  bodyText: string,
  badge?: { label: string; color: string }
) {
  const fullSubject = `CultTrack: ${subject}`;
  const text = `Hello ${recipientName},\n\n${bodyText}\n\nThis is an automated notification from CultTrack AI.`;
  const html = buildEmailHtml(recipientName, subject, bodyText, badge);

  try {
    if (resendApiKey) {
      const response = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${resendApiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          from: resendFrom,
          to: [to],
          subject: fullSubject,
          text,
          html,
        }),
      });

      const result = await response.json().catch(() => null) as { id?: string; message?: string } | null;
      if (!response.ok) {
        console.error('[Resend Error] Failed to send email:', result);
        return;
      }

      console.log(`[Resend] Sent to ${to}${result?.id ? ` | ID: ${result.id}` : ''}`);
      return;
    }

    const transporter = await transporterPromise;
    if (!transporter) {
      console.log(`[Email Skipped] SMTP is not configured or failed verification. To: ${to} | Subject: ${subject}`);
      return;
    }

    const fromAddress = smtpUser
      ? `"CultTrack AI" <${smtpUser}>`
      : '"CultTrack AI" <no-reply@culttrack.in>';
    const info = await transporter.sendMail({
      from: fromAddress,
      to,
      subject: fullSubject,
      text,
      html,
    });

    const previewUrl = nodemailer.getTestMessageUrl(info);
    console.log(`[Email] Sent to ${to}${previewUrl ? ` | Preview: ${previewUrl}` : ''}`);
  } catch (error) {
    console.error(`[Email Error] Failed to send to ${to}:`, error);
  }
}

export async function createNotification(
  userId: string,
  title: string,
  message: string,
  type: string,
  badge?: { label: string; color: string }
) {
  try {
    const notification = await prisma.notification.create({
      data: { userId, title, message, type },
    });

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { email: true, fullName: true },
    });

    if (user?.email) {
      void sendEmail(user.email, user.fullName, title, message, badge);
    }

    return notification;
  } catch (error) {
    console.error('[Notification Error]', error);
  }
}

export async function sendPasswordResetEmail(to: string, recipientName: string, resetUrl: string) {
  await sendEmail(
    to,
    recipientName,
    'Password Reset Request',
    `We received a request to reset your CultTrack password. Use this secure link within 30 minutes:<br/><br/><a href="${resetUrl}" style="color:#93c5fd;font-weight:700;">Reset your password</a><br/><br/>If the button does not open, copy this link: ${resetUrl}`,
    { label: 'RESET PASSWORD', color: '#4f46e5' }
  );
}

export async function notifyAdmins(
  title: string,
  message: string,
  type: string,
  badge?: { label: string; color: string }
) {
  try {
    const admins = await prisma.user.findMany({
      where: { role: 'ADMIN' },
      select: { id: true, email: true, fullName: true },
    });

    await Promise.all(
      admins.map(async (admin) => {
        await prisma.notification.create({
          data: { userId: admin.id, title, message, type },
        });
        void sendEmail(admin.email, admin.fullName, title, message, badge);
      })
    );

    console.log(`[Admin Notify] Notified ${admins.length} admin(s): ${title}`);
  } catch (error) {
    console.error('[Admin Notification Error]', error);
  }
}

export async function logAudit(userId: string, action: string, details: string) {
  try {
    const log = await prisma.auditLog.create({
      data: { userId, action, details },
    });
    console.log(`[Audit Log] ${action} by ${userId}: ${details}`);
    return log;
  } catch (error) {
    console.error('[Audit Error]', error);
  }
}
