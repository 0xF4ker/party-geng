import { transporter } from "../mailer";
import type SMTPTransport from "nodemailer/lib/smtp-transport";
import type { Address } from "nodemailer/lib/mailer";

interface GuestInvitationData {
  name: string;
  eventTitle: string;
  link: string;
}

interface WelcomeData {
  username: string;
  role: "CLIENT" | "VENDOR";
}

type TemplateDataMap = {
  GUEST_INVITATION: GuestInvitationData;
  WELCOME_ONBOARDING: WelcomeData;
};

interface MailOptions<T extends keyof TemplateDataMap> {
  to: string | Address | (string | Address)[];
  subject: string;
  template: T;
  data: TemplateDataMap[T];
}

export const emailService = {
  async send<T extends keyof TemplateDataMap>({
    to,
    subject,
    template,
    data,
  }: MailOptions<T>): Promise<SMTPTransport.SentMessageInfo> {
    const html = this.generateHtml(template, data);

    try {
      return await transporter.sendMail({
        from: `"Partygeng" <${process.env.SMTP_USER}>`,
        to,
        subject,
        html,
      });
    } catch (_error: unknown) {
      const message =
        _error instanceof Error ? _error.message : "Unknown error";
      console.error(`Mail dispatch failed for ${template}:`, message);
      throw new Error("MAIL_DISPATCH_FAILURE");
    }
  },

  generateHtml<T extends keyof TemplateDataMap>(
    template: T,
    data: TemplateDataMap[T],
  ): string {
    const logoUrl =
      "https://raw.githubusercontent.com/0xF4ker/party-geng/main/public/logo.png";

    const header = `
      <div style="font-family: sans-serif; max-width: 600px; margin: auto; border: 1px solid #eee; padding: 20px; border-radius: 12px;">
        <div style="text-align: center; margin-bottom: 20px;">
          <img src="${logoUrl}" width="140" alt="Partygeng Logo" />
        </div>
    `;
    const footer = `
        <hr style="border: 0; border-top: 1px solid #eee; margin: 30px 0;" />
        <p style="font-size: 12px; color: #999; text-align: center;">
          &copy; 2026 PartyGeng International Ltd. Lagos, Nigeria.
        </p>
      </div>
    `;

    if (template === "GUEST_INVITATION") {
      const d = data as GuestInvitationData;
      return `${header}
        <h2 style="color: #db2777;">You're Invited!</h2>
        <p>Hi <strong>${d.name}</strong>,</p>
        <p>You've been invited to: <strong>${d.eventTitle}</strong>.</p>
        <div style="text-align: center; margin: 30px 0;">
          <a href="${d.link}" style="background-color: #db2777; color: white; padding: 14px 28px; text-decoration: none; border-radius: 8px; font-weight: bold; display: inline-block;">View Invitation</a>
        </div>
        ${footer}`;
    }

    if (template === "WELCOME_ONBOARDING") {
      const d = data as WelcomeData;
      return `${header}
        <h2 style="color: #db2777;">Welcome to the Geng!</h2>
        <p>Hi ${d.username}, your account as a <strong>${d.role}</strong> is now verified and active.</p>
        ${footer}`;
    }

    return "";
  },
};
