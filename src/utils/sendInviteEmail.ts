import nodemailer from "nodemailer";

const transporter = nodemailer.createTransport({
  host: process.env.MAILTRAP_HOST,
  port: Number(process.env.MAILTRAP_PORT),
  auth: {
    user: process.env.MAILTRAP_USERNAME,
    pass: process.env.MAILTRAP_PASSWORD,
  },
});

export async function sendInviteEmail(
  to: string,
  eventTitle: string,
  token: string,
) {
  try {
    const info = await transporter.sendMail({
      from: process.env.APP_EMAIL,
      to,
      subject: `You're Invited to ${eventTitle}`,
      html: `<p>Click <a href="http://localhost:5000/api/auth/register?token=${token}">here</a> to join the event!</p>`,
    });
    console.log("Email sent:", info.messageId);
    return info;
  } catch (error) {
    console.error("Email error:", error);
    throw new Error("Failed to send email");
  }
}
