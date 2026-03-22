import nodemailer from "nodemailer";
import type { Transporter } from "nodemailer";
import type { EmailJob } from "../index";

// ── SMTP configuration ─────────────────────────────────────────────

let transporter: Transporter | null = null;

function getTransporter(): Transporter {
  if (!transporter) {
    transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST || "localhost",
      port: parseInt(process.env.SMTP_PORT || "587", 10),
      secure: process.env.SMTP_PORT === "465",
      auth: {
        user: process.env.SMTP_USER || "",
        pass: process.env.SMTP_PASS || "",
      },
    });
  }
  return transporter;
}

function getFromAddress(): string {
  return process.env.EMAIL_FROM || "PixelStock <noreply@pixelstock.com>";
}

// ── Template types ─────────────────────────────────────────────────

type TemplateName =
  | "welcome"
  | "upload_approved"
  | "upload_rejected"
  | "new_follower"
  | "content_reported"
  | "contributor_approved";

interface RenderedEmail {
  subject: string;
  html: string;
  text: string;
}

// ── Shared styles ──────────────────────────────────────────────────

const BRAND_COLOR = "#2563eb";
const BRAND_NAME = "PixelStock";

function wrapHtml(title: string, bodyContent: string): string {
  return `<!DOCTYPE html>
<html lang="en">
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#f4f4f5;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f4f4f5;padding:32px 0">
    <tr><td align="center">
      <table width="560" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:8px;overflow:hidden;box-shadow:0 1px 3px rgba(0,0,0,0.1)">
        <!-- Header -->
        <tr><td style="background:${BRAND_COLOR};padding:24px 32px">
          <h1 style="margin:0;color:#ffffff;font-size:20px;font-weight:600">${BRAND_NAME}</h1>
        </td></tr>
        <!-- Body -->
        <tr><td style="padding:32px">
          <h2 style="margin:0 0 16px;color:#18181b;font-size:18px;font-weight:600">${title}</h2>
          ${bodyContent}
        </td></tr>
        <!-- Footer -->
        <tr><td style="padding:16px 32px;background:#fafafa;border-top:1px solid #e4e4e7">
          <p style="margin:0;color:#a1a1aa;font-size:12px;text-align:center">
            &copy; ${new Date().getFullYear()} ${BRAND_NAME}. All rights reserved.
          </p>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`;
}

function paragraph(text: string): string {
  return `<p style="margin:0 0 16px;color:#3f3f46;font-size:14px;line-height:1.6">${text}</p>`;
}

function button(text: string, url: string): string {
  return `<table cellpadding="0" cellspacing="0" style="margin:24px 0"><tr><td>
    <a href="${url}" style="display:inline-block;background:${BRAND_COLOR};color:#ffffff;padding:12px 24px;border-radius:6px;text-decoration:none;font-size:14px;font-weight:500">${text}</a>
  </td></tr></table>`;
}

// ── Template rendering ─────────────────────────────────────────────

function renderTemplate(
  template: TemplateName,
  data: Record<string, any>,
): RenderedEmail {
  switch (template) {
    case "welcome":
      return renderWelcome(data);
    case "upload_approved":
      return renderUploadApproved(data);
    case "upload_rejected":
      return renderUploadRejected(data);
    case "new_follower":
      return renderNewFollower(data);
    case "content_reported":
      return renderContentReported(data);
    case "contributor_approved":
      return renderContributorApproved(data);
    default: {
      const _exhaustive: never = template;
      throw new Error(`Unknown email template: ${template}`);
    }
  }
}

// ── Individual templates ───────────────────────────────────────────

function renderWelcome(data: Record<string, any>): RenderedEmail {
  const name = data.name || "there";
  const dashboardUrl = data.dashboardUrl || "https://pixelstock.com/dashboard";

  return {
    subject: `Welcome to ${BRAND_NAME}! 🎉`,
    html: wrapHtml(
      `Welcome, ${name}!`,
      paragraph(`Thanks for joining ${BRAND_NAME} — the community-driven platform for stunning stock photos and videos.`) +
      paragraph("Here's what you can do now:") +
      `<ul style="color:#3f3f46;font-size:14px;line-height:1.8;padding-left:20px;margin:0 0 16px">
        <li>Browse thousands of free, high-quality photos &amp; videos</li>
        <li>Create collections to organize your favorites</li>
        <li>Apply to become a contributor and share your work</li>
      </ul>` +
      button("Go to Dashboard", dashboardUrl),
    ),
    text: [
      `Welcome to ${BRAND_NAME}, ${name}!`,
      "",
      "Thanks for joining — the community-driven platform for stunning stock photos and videos.",
      "",
      "Here's what you can do:",
      "- Browse thousands of free, high-quality photos & videos",
      "- Create collections to organize your favorites",
      "- Apply to become a contributor and share your work",
      "",
      `Visit your dashboard: ${dashboardUrl}`,
    ].join("\n"),
  };
}

function renderUploadApproved(data: Record<string, any>): RenderedEmail {
  const title = data.title || "Your upload";
  const mediaUrl = data.mediaUrl || "https://pixelstock.com";

  return {
    subject: `Your upload "${title}" has been approved! ✅`,
    html: wrapHtml(
      "Upload Approved",
      paragraph(`Great news! Your upload <strong>"${title}"</strong> has been reviewed and approved by our team.`) +
      paragraph("It's now live on PixelStock and available for the community to discover, download, and enjoy.") +
      button("View Your Upload", mediaUrl),
    ),
    text: [
      `Your upload "${title}" has been approved!`,
      "",
      "It's now live on PixelStock and available for the community to discover, download, and enjoy.",
      "",
      `View it here: ${mediaUrl}`,
    ].join("\n"),
  };
}

function renderUploadRejected(data: Record<string, any>): RenderedEmail {
  const title = data.title || "Your upload";
  const reason = data.reason || "It did not meet our quality guidelines.";
  const editUrl = data.editUrl || "https://pixelstock.com/dashboard/uploads";

  return {
    subject: `Your upload "${title}" needs changes`,
    html: wrapHtml(
      "Upload Needs Changes",
      paragraph(`We've reviewed your upload <strong>"${title}"</strong> and it wasn't approved at this time.`) +
      paragraph(`<strong>Reason:</strong> ${reason}`) +
      paragraph("Don't worry — you can make adjustments and resubmit. Our team is happy to review again.") +
      button("Edit &amp; Resubmit", editUrl),
    ),
    text: [
      `Your upload "${title}" needs changes.`,
      "",
      `Reason: ${reason}`,
      "",
      "You can make adjustments and resubmit for review.",
      "",
      `Edit here: ${editUrl}`,
    ].join("\n"),
  };
}

function renderNewFollower(data: Record<string, any>): RenderedEmail {
  const followerName = data.followerName || "Someone";
  const followerUrl = data.followerUrl || "https://pixelstock.com";
  const profileUrl = data.profileUrl || "https://pixelstock.com/dashboard";

  return {
    subject: `${followerName} started following you on ${BRAND_NAME}`,
    html: wrapHtml(
      "New Follower",
      paragraph(`<strong><a href="${followerUrl}" style="color:${BRAND_COLOR};text-decoration:none">${followerName}</a></strong> is now following you on ${BRAND_NAME}.`) +
      paragraph("Keep creating amazing content — your audience is growing!") +
      button("View Your Profile", profileUrl),
    ),
    text: [
      `${followerName} started following you on ${BRAND_NAME}.`,
      "",
      "Keep creating amazing content — your audience is growing!",
      "",
      `View your profile: ${profileUrl}`,
    ].join("\n"),
  };
}

function renderContentReported(data: Record<string, any>): RenderedEmail {
  const mediaType = data.mediaType || "content";
  const mediaTitle = data.mediaTitle || "Untitled";
  const reportReason = data.reportReason || "Community guidelines violation";
  const reporterName = data.reporterName || "A user";
  const adminUrl = data.adminUrl || "https://pixelstock.com/admin/reports";

  return {
    subject: `[Admin] Content reported: "${mediaTitle}"`,
    html: wrapHtml(
      "Content Reported",
      paragraph(`A ${mediaType} has been reported and requires your review.`) +
      `<table style="width:100%;border-collapse:collapse;margin:0 0 16px">
        <tr><td style="padding:8px 12px;border:1px solid #e4e4e7;color:#71717a;font-size:13px;width:120px">Content</td>
            <td style="padding:8px 12px;border:1px solid #e4e4e7;color:#3f3f46;font-size:13px"><strong>${mediaTitle}</strong></td></tr>
        <tr><td style="padding:8px 12px;border:1px solid #e4e4e7;color:#71717a;font-size:13px">Type</td>
            <td style="padding:8px 12px;border:1px solid #e4e4e7;color:#3f3f46;font-size:13px">${mediaType}</td></tr>
        <tr><td style="padding:8px 12px;border:1px solid #e4e4e7;color:#71717a;font-size:13px">Reported by</td>
            <td style="padding:8px 12px;border:1px solid #e4e4e7;color:#3f3f46;font-size:13px">${reporterName}</td></tr>
        <tr><td style="padding:8px 12px;border:1px solid #e4e4e7;color:#71717a;font-size:13px">Reason</td>
            <td style="padding:8px 12px;border:1px solid #e4e4e7;color:#3f3f46;font-size:13px">${reportReason}</td></tr>
      </table>` +
      button("Review in Admin Panel", adminUrl),
    ),
    text: [
      `[Admin] Content reported: "${mediaTitle}"`,
      "",
      `Type: ${mediaType}`,
      `Reported by: ${reporterName}`,
      `Reason: ${reportReason}`,
      "",
      `Review: ${adminUrl}`,
    ].join("\n"),
  };
}

function renderContributorApproved(data: Record<string, any>): RenderedEmail {
  const name = data.name || "there";
  const uploadUrl = data.uploadUrl || "https://pixelstock.com/dashboard/upload";

  return {
    subject: `You're now a ${BRAND_NAME} contributor! 🎨`,
    html: wrapHtml(
      `Congratulations, ${name}!`,
      paragraph(`Your application to become a ${BRAND_NAME} contributor has been approved!`) +
      paragraph("As a contributor, you can now:") +
      `<ul style="color:#3f3f46;font-size:14px;line-height:1.8;padding-left:20px;margin:0 0 16px">
        <li>Upload your photos and videos to the platform</li>
        <li>Reach millions of people looking for quality stock media</li>
        <li>Track your download stats and engagement</li>
        <li>Build your reputation in the creative community</li>
      </ul>` +
      paragraph("We can't wait to see what you create!") +
      button("Start Uploading", uploadUrl),
    ),
    text: [
      `Congratulations, ${name}! You're now a ${BRAND_NAME} contributor!`,
      "",
      "As a contributor, you can now:",
      "- Upload your photos and videos to the platform",
      "- Reach millions of people looking for quality stock media",
      "- Track your download stats and engagement",
      "- Build your reputation in the creative community",
      "",
      `Start uploading: ${uploadUrl}`,
    ].join("\n"),
  };
}

// ── Main worker ────────────────────────────────────────────────────

export async function sendEmail(job: { data: EmailJob }): Promise<void> {
  const { to, subject: subjectOverride, template, data } = job.data;

  console.log(`[sendEmail] Sending "${template}" email to ${to}`);

  try {
    // Render the template
    const rendered = renderTemplate(template as TemplateName, data);

    // Allow subject override from job data
    const subject = subjectOverride || rendered.subject;

    // Send via nodemailer
    const transport = getTransporter();
    const info = await transport.sendMail({
      from: getFromAddress(),
      to,
      subject,
      html: rendered.html,
      text: rendered.text,
    });

    console.log(`[sendEmail] Sent "${template}" to ${to} (messageId: ${info.messageId})`);
  } catch (err: any) {
    console.error(`[sendEmail] Failed to send "${template}" to ${to}:`, err.message);
    // Re-throw so BullMQ can retry according to its retry policy
    throw err;
  }
}
