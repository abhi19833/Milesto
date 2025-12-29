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
  <div style="font-family:Arial, sans-serif;">
    <h3>You are invited to a project</h3>

    <p>${"You have been invited to join a project."}</p>

    <a
      href="${inviteLink}"
      target="_blank"
      style="
        background:#2563eb;
        color:#fff;
        padding:8px 14px;
        text-decoration:none;
        border-radius:4px;
        display:inline-block;
      "
    >
      Accept Invitation
    </a>
  </div>
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
