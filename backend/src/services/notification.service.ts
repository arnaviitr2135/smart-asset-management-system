import { PrismaClient } from '@prisma/client';
import * as nodemailer from 'nodemailer';

const prisma = new PrismaClient();

// ─── Transporter (Gmail via SMTP_USER/SMTP_PASS, fallback to Ethereal) ───────
let transporterPromise = (async () => {
  const smtpUser = process.env.SMTP_USER;
  const smtpPass = process.env.SMTP_PASS;

  // If Gmail credentials are set, use Gmail SMTP
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
      console.log(`[SMTP] ✅ Gmail SMTP connected as: ${smtpUser}`);
      console.log(`[SMTP] Emails will be delivered to REAL inboxes.`);
      return transport;
    } catch (err) {
      console.error('[SMTP Error] Gmail auth failed, falling back to Ethereal test inbox.', err);
    }
  } else {
    console.log(`[SMTP] No SMTP_USER/SMTP_PASS in .env — using Ethereal test inbox.`);
    console.log(`[SMTP] To send REAL emails, add your Gmail credentials to backend/.env`);
  }

  // Fallback: Ethereal test account (emails visible via preview URLs in console)
  try {
    const account = await nodemailer.createTestAccount();
    console.log(`[SMTP] Ethereal test inbox: ${account.user}`);
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

// ─── Shared HTML email builder ────────────────────────────────────────────────
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

        <!-- Header -->
        <div style="background:linear-gradient(135deg,#7c3aed,#4f46e5);padding:28px 32px;">
          <h1 style="margin:0;font-size:20px;font-weight:700;color:#fff;letter-spacing:-0.5px;">
            🛡️ CultTrack <span style="color:#c4b5fd;">AI</span>
          </h1>
          <p style="margin:4px 0 0;font-size:11px;color:rgba(255,255,255,0.6);
            text-transform:uppercase;letter-spacing:2px;">IIT Roorkee Cultural Council</p>
        </div>

        <!-- Body -->
        <div style="padding:28px 32px;color:#e2e4ea;">
          <p style="margin:0 0 8px;font-size:14px;color:#9ca3af;">Hello,</p>
          <p style="margin:0 0 16px;font-size:16px;font-weight:600;color:#fff;">${recipientName}</p>

          <div style="background:#262932;border-left:4px solid #7c3aed;border-radius:0 8px 8px 0;
            padding:16px 20px;margin:16px 0;">
            <p style="margin:0;font-size:14px;color:#d1d5db;line-height:1.7;">${body}</p>
          </div>

          ${badgeHtml}
        </div>

        <!-- Footer -->
        <div style="padding:16px 32px;border-top:1px solid #2b2e3a;background:#12141a;">
          <p style="margin:0;font-size:11px;color:#4b5563;text-align:center;">
            This is an automated message from CultTrack AI. Please do not reply directly.
          </p>
        </div>
      </div>
    </div>
  `;
}

// ─── Core send email helper (raw, no DB notification) ───────────────────────
async function sendEmail(
  to: string,
  recipientName: string,
  subject: string,
  bodyText: string,
  badge?: { label: string; color: string }
) {
  try {
    const transporter = await transporterPromise;
    if (!transporter) {
      console.log(`[Email Sandbox] To: ${to} | Subject: ${subject} | Body: ${bodyText}`);
      return;
    }

    const fromAddress = process.env.SMTP_USER
      ? `"CultTrack AI" <${process.env.SMTP_USER}>`
      : '"CultTrack AI" <no-reply@culttrack.in>';
    const info = await transporter.sendMail({
      from: fromAddress,
      to,
      subject: `CultTrack: ${subject}`,
      text: `Hello ${recipientName},\n\n${bodyText}\n\nThis is an automated notification from CultTrack AI.`,
      html: buildEmailHtml(recipientName, subject, bodyText, badge),
    });

    const previewUrl = nodemailer.getTestMessageUrl(info);
    console.log(`[Email] Sent to ${to} → Preview: ${previewUrl}`);
  } catch (error) {
    console.error(`[Email Error] Failed to send to ${to}:`, error);
  }
}

// ─── Create in-app notification + send email to ONE user ─────────────────────
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
      await sendEmail(user.email, user.fullName, title, message, badge);
    }

    return notification;
  } catch (error) {
    console.error('[Notification Error]', error);
  }
}

// ─── Send email + in-app notification to ALL ADMINs ─────────────────────────
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
        // In-app
        await prisma.notification.create({
          data: { userId: admin.id, title, message, type },
        });
        // Email
        await sendEmail(admin.email, admin.fullName, title, message, badge);
      })
    );

    console.log(`[Admin Notify] Notified ${admins.length} admin(s): ${title}`);
  } catch (error) {
    console.error('[Admin Notification Error]', error);
  }
}

// ─── Audit Logger ─────────────────────────────────────────────────────────────
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
