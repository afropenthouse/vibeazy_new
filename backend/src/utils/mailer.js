const nodemailer = require("nodemailer");

function createTransport() {
  const host = process.env.SMTP_HOST;
  const port = Number(process.env.SMTP_PORT || 0);
  const secure = String(process.env.SMTP_SECURE || "false").toLowerCase() === "true";
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;

  if (!host || !port || !user || !pass) {
    throw new Error("SMTP configuration missing. Set SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS in .env");
  }

  return nodemailer.createTransport({ host, port, secure, auth: { user, pass } });
}

async function sendPasswordResetEmail(to, token) {
  const appBase = process.env.APP_BASE_URL || "http://localhost:3000";
  const from = process.env.MAIL_FROM || "no-reply@localhost";
  const resetUrl = `${appBase}/reset-password?token=${encodeURIComponent(token)}`;

  const transport = createTransport();
  const info = await transport.sendMail({
    from,
    to,
    subject: "Reset your VibeEazy password",
    html: `
      <!doctype html>
      <html>
        <head>
          <meta name="viewport" content="width=device-width, initial-scale=1" />
          <meta http-equiv="Content-Type" content="text/html; charset=UTF-8" />
          <title>Reset Password</title>
          <style>
            body { background:#f6f9fc; margin:0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Ubuntu, 'Helvetica Neue', Arial, 'Noto Sans', sans-serif; }
            .container { width:100%; padding:24px; }
            .card { max-width:560px; margin:0 auto; background:#ffffff; border-radius:12px; box-shadow:0 10px 30px rgba(0,0,0,0.06); overflow:hidden; }
            .header { background:#111827; color:#fff; padding:18px 24px; font-weight:600; }
            .content { padding:24px; color:#1f2937; }
            .btn { display:inline-block; background:#2563eb; color:#fff !important; text-decoration:none; padding:12px 18px; border-radius:8px; font-weight:600; }
            .muted { color:#6b7280; font-size:13px; }
            a { color:#2563eb; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="card">
              <div class="header">VibeEazy</div>
              <div class="content">
                <h2 style="margin:0 0 8px 0; font-size:20px;">Reset your password</h2>
                <p style="margin:0 0 16px 0;">You requested a password reset. Click the button below to set a new password. This link expires in 1 hour.</p>
                <p style="margin:24px 0;">
                  <a class="btn" href="${resetUrl}">Reset Password</a>
                </p>
                <p class="muted">If you didn’t request this, please ignore this email.</p>
              </div>
            </div>
          </div>
        </body>
      </html>
    `,
    text: `Reset your password: ${resetUrl}`,
  });
  return info;
}

async function sendVerificationEmail(to, token) {
  const appBase = process.env.APP_BASE_URL || "http://localhost:3000";
  const from = process.env.MAIL_FROM || "no-reply@localhost";
  const verifyUrl = `${appBase}/verify-email?token=${encodeURIComponent(token)}`;

  const transport = createTransport();
  const info = await transport.sendMail({
    from,
    to,
    subject: "Verify your VibeEazy email",
    html: `
      <!doctype html>
      <html>
        <head>
          <meta name="viewport" content="width=device-width, initial-scale=1" />
          <meta http-equiv="Content-Type" content="text/html; charset=UTF-8" />
          <title>Verify Email</title>
          <style>
            body { background:#f6f9fc; margin:0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Ubuntu, 'Helvetica Neue', Arial, 'Noto Sans', sans-serif; }
            .container { width:100%; padding:24px; }
            .card { max-width:560px; margin:0 auto; background:#ffffff; border-radius:12px; box-shadow:0 10px 30px rgba(0,0,0,0.06); overflow:hidden; }
            .header { background:#111827; color:#fff; padding:18px 24px; font-weight:600; }
            .content { padding:24px; color:#1f2937; }
            .btn { display:inline-block; background:#10b981; color:#fff !important; text-decoration:none; padding:12px 18px; border-radius:8px; font-weight:600; }
            .muted { color:#6b7280; font-size:13px; }
            a { color:#10b981; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="card">
              <div class="header">VibeEazy</div>
              <div class="content">
                <h2 style="margin:0 0 8px 0; font-size:20px;">Welcome!</h2>
                <p style="margin:0 0 16px 0;">Please verify your email address to finish setting up your account.</p>
                <p style="margin:24px 0;">
                  <a class="btn" href="${verifyUrl}">Verify Email</a>
                </p>
                <p class="muted">If you didn’t sign up, you can safely ignore this message.</p>
              </div>
            </div>
          </div>
        </body>
      </html>
    `,
    text: `Verify your email: ${verifyUrl}`,
  });
  return info;
}

module.exports = { sendPasswordResetEmail, sendVerificationEmail };