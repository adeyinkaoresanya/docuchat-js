import emailClient from "../config/nodemailer";
import { config } from "../config/env";


export async function sendWelcomeEmail(email: string) {
  await emailClient.sendMail({
    from: config.MAIL_FROM,
    to: email,
    subject: "Welcome to DocuChat!",

    text: `
      Welcome to DocuChat!

      Your account has been successfully created.
      We're glad to have you here.
    `,

    html: `
      <h1>Welcome to DocuChat!</h1>

      <p>Your account has been successfully created.</p>

      <p>We're glad to have you here.</p>
    `,
  });
}