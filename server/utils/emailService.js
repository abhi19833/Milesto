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

  // Safety check
  if (!inviteLink.startsWith("http")) {
    throw new Error("inviteLink must be a valid URL");
  }

  const html = `
    <h2>You are invited to a project</h2>

    <p><strong>Role:</strong> ${role || "member"}</p>

    <p>${message || "You have been invited to join a project."}</p>

    <a
      href="${inviteLink}"
      style="
        display:inline-block;
        padding:12px 20px;
        background:#2563eb;
        color:#fff;
        text-decoration:none;
        border-radius:6px;
        font-weight:600;
      "
    >
      Accept Invitation
    </a>

    <p style="font-size:12px;margin-top:10px;">
      If the button does not work, copy and paste this link:<br/>
      ${inviteLink}
    </p>
  `;

  return sgMail.send({
    to,
    from: process.env.EMAIL_FROM,
    subject,
    html,
  });
};

console.log("EMAIL_FROM:", process.env.EMAIL_FROM);

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
