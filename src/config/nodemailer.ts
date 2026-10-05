import nodemailer from "nodemailer";
import { config } from "./env";

const emailClient = nodemailer.createTransport({
  host: config.SMTP_HOST,
  port: Number(config.SMTP_PORT),
  secure: config.SMTP_SECURE === 'true', // true for 465, false for other ports

  auth: {
    user: config.SMTP_USER,
    pass: config.SMTP_PASSWORD,
  },
});

export default emailClient;
