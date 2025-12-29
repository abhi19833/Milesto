import "dotenv/config";
import sgMail from "@sendgrid/mail";

sgMail.setApiKey(process.env.SENDGRID_API_KEY);

export const sendInviteEmail = async (
  to,
  subject,
  inviteLink,
  role,
  message
) => {
  if (!to || !subject || !inviteLink) {
    throw new Error("Missing email fields");
  }

  const html = `
    <h2>You are invited to a project</h2>
    <p><strong>Role:</strong> ${role || "member"}</p>
    <p>${message || "You have been invited to join a project."}</p>
    <a href="${inviteLink}" target="_blank">
      Accept Invitation
    </a>
  `;

  return sgMail.send({
    to,
    from: process.env.EMAIL_FROM,
    subject,
    html,
  });
};

export const sendResetPasswordEmail = async (to, resetLink) => {
  return sgMail.send({
    to: to,
    from: process.env.EMAIL_FROM,
    subject: "Reset your password",
    html: `
      <p>You requested a password reset</p>
      <a href="${resetLink}">Reset Password</a>
      <p>This link expires in 15 minutes</p>
    `,
  });
};
