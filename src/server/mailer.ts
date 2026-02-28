import * as nodemailer from "nodemailer";
import type SMTPTransport from "nodemailer/lib/smtp-transport";

const smtpConfig: SMTPTransport.Options = {
  host: process.env.SMTP_HOST,
  port: Number(process.env.SMTP_PORT) || 465,
  secure: true,
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
};

export const transporter = nodemailer.createTransport(smtpConfig);
