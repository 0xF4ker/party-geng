import { transporter } from "../mailer";
import type SMTPTransport from "nodemailer/lib/smtp-transport";
import type { Address } from "nodemailer/lib/mailer";
interface GuestInvitationData {
  name: string;
  eventTitle: string;
  link: string;
  hostName?: string;
  date?: string;
  location?: string;
  price?: string;
  tableNumber?: string;
}
interface GuestConfirmationData {
  name: string;
  eventTitle: string;
  date?: string;
  location?: string;
  mapsLink?: string;
  ticketTierName?: string;
  ticketPrice?: string;
  tableNumber?: string;
  hasPaid?: boolean;
}
interface WelcomeData {
  username: string;
  role: "CLIENT" | "VENDOR" | "COORDINATOR";
}
type TemplateDataMap = {
  GUEST_INVITATION: GuestInvitationData;
  WELCOME_ONBOARDING: WelcomeData;
  GUEST_CONFIRMATION: GuestConfirmationData;
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
        from: `"Partygeng" <${process.env.SMTP_FROM || "notification@mail.partygeng.com"}>`,
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
      const hostLine = d.hostName ? `<p style="font-size: 15px; color: #4b5563; margin: 4px 0 0 0;">Hosted by: <strong>${d.hostName}</strong></p>` : "";
      const dateLine = d.date ? `<p style="font-size: 14px; margin: 6px 0; color: #4b5563;">📅 <strong>Date:</strong> ${d.date}</p>` : "";
      const locationLine = d.location ? `<p style="font-size: 14px; margin: 6px 0; color: #4b5563;">📍 <strong>Location:</strong> ${d.location}</p>` : "";
      const priceLine = d.price ? `<p style="font-size: 14px; margin: 6px 0; color: #4b5563;">🎟️ <strong>Admission:</strong> ${d.price}</p>` : "";
      const tableLine = d.tableNumber ? `<p style="font-size: 14px; margin: 6px 0; color: #4b5563;">🪑 <strong>Table Assignment:</strong> Table ${d.tableNumber}</p>` : "";
 
      return `${header}
        <h2 style="color: #db2777; font-size: 24px; font-weight: 800; margin-bottom: 8px; text-align: center;">You're Invited!</h2>
        <p style="font-size: 16px; line-height: 1.5; color: #374151;">Hi <strong>${d.name}</strong>,</p>
        <p style="font-size: 16px; line-height: 1.5; color: #374151;">You have been cordially invited to celebrate at the upcoming event:</p>
        
        <div style="background-color: #fdf2f8; border: 1px solid #fbcfe8; border-radius: 12px; padding: 20px; margin: 24px 0;">
          <h3 style="color: #be185d; font-size: 18px; font-weight: 700; margin: 0 0 10px 0;">${d.eventTitle}</h3>
          ${hostLine}
          <div style="border-top: 1px solid #fbcfe8; margin-top: 12px; padding-top: 12px;">
            ${dateLine}
            ${locationLine}
            ${priceLine}
            ${tableLine}
          </div>
        </div>

        <div style="text-align: center; margin: 30px 0;">
          <a href="${d.link}" style="background-color: #db2777; color: white; padding: 14px 28px; text-decoration: none; border-radius: 8px; font-weight: bold; display: inline-block; box-shadow: 0 4px 12px rgba(219,39,119,0.3);">RSVP & Confirm Attendance</a>
        </div>
        ${footer}`;
    }
    if (template === "GUEST_CONFIRMATION") {
      const d = data as GuestConfirmationData;
      return `${header}
        <div style="background-color: #fafafa; padding: 16px; border-radius: 16px; border: 1px solid #e5e7eb; margin: 20px 0;">
          <div style="background: linear-gradient(135deg, #db2777, #7209b7); padding: 24px; text-align: center; color: #ffffff; border-radius: 12px 12px 0 0;">
            <span style="font-size: 10px; font-weight: 800; letter-spacing: 2px; text-transform: uppercase; background-color: rgba(255,255,255,0.2); padding: 4px 10px; border-radius: 20px;">RSVP CONFIRMED</span>
            <h2 style="margin: 10px 0 0 0; font-size: 22px; font-weight: 800; line-height: 1.3; color: #ffffff;">Your Invitation Card</h2>
            <p style="margin: 4px 0 0 0; font-size: 13px; opacity: 0.9;">Present this stub at the entrance</p>
          </div>
          <div style="padding: 24px; background-color: #ffffff; border-radius: 0 0 12px 12px; border: 1px solid #f3f4f6; border-top: none;">
            <h3 style="font-size: 18px; font-weight: 800; color: #111827; margin: 0 0 4px 0; text-align: center;">${d.eventTitle}</h3>
            <p style="font-size: 13px; text-align: center; color: #6b7280; margin: 0 0 20px 0;">Guest: <strong>${d.name}</strong></p>
            
            <div style="border-top: 2px dashed #e5e7eb; margin: 16px 0; position: relative;"></div>

            <table style="width: 100%; border-collapse: collapse; font-size: 13px;">
              <tr>
                <td style="padding: 8px 0; color: #6b7280; font-weight: 500; width: 35%;">📅 Date & Time</td>
                <td style="padding: 8px 0; color: #1f2937; font-weight: 700;">${d.date || "To be announced"}</td>
              </tr>
              <tr>
                <td style="padding: 8px 0; color: #6b7280; font-weight: 500; vertical-align: top;">📍 Location</td>
                <td style="padding: 8px 0; color: #1f2937; font-weight: 700;">
                  ${d.location || "To be announced"}
                  ${d.mapsLink ? `<br/><a href="${d.mapsLink}" style="display: inline-block; margin-top: 6px; color: #db2777; font-weight: 700; text-decoration: none; font-size: 11px;">🗺️ View on Google Maps</a>` : ""}
                </td>
              </tr>
              <tr>
                <td style="padding: 8px 0; color: #6b7280; font-weight: 500;">🎟️ Admission</td>
                <td style="padding: 8px 0; color: #1f2937; font-weight: 700;">
                  ${d.ticketTierName ? `${d.ticketTierName} (${d.ticketPrice})` : "General Admission"}
                  ${d.hasPaid ? ` <span style="background-color: #d1fae5; color: #065f46; font-size: 9px; padding: 2px 6px; border-radius: 10px; font-weight: bold; margin-left: 6px; vertical-align: middle;">PAID</span>` : ""}
                </td>
              </tr>
              ${d.tableNumber ? `
              <tr>
                <td style="padding: 8px 0; color: #6b7280; font-weight: 500;">🪑 Table</td>
                <td style="padding: 8px 0; color: #1f2937; font-weight: 700;">Table ${d.tableNumber}</td>
              </tr>` : ""}
            </table>
          </div>
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
