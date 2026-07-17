const nodemailer = require('nodemailer');

const isConfigured = () => Boolean(process.env.EMAIL_USER && process.env.EMAIL_PASS);

const getTransporter = () =>
  nodemailer.createTransport({
    host: process.env.EMAIL_HOST || 'smtp.gmail.com',
    port: Number(process.env.EMAIL_PORT) || 587,
    secure: Number(process.env.EMAIL_PORT) === 465,
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS,
    },
  });

const sendEmail = async ({ to, subject, html, text }) => {
  // Dev fallback: without SMTP credentials, log instead of failing so the
  // app remains fully usable locally
  if (!isConfigured()) {
    console.log('---------------------------------------------');
    console.log(`[email disabled] Would send to: ${to}`);
    console.log(`[email disabled] Subject: ${subject}`);
    console.log(`[email disabled] ${text}`);
    console.log('---------------------------------------------');
    return;
  }

  await getTransporter().sendMail({
    from: process.env.EMAIL_FROM || `"Expense Tracker" <${process.env.EMAIL_USER}>`,
    to,
    subject,
    text,
    html,
  });
};

const layout = (content) => `
  <div style="font-family:Segoe UI,Arial,sans-serif;max-width:480px;margin:0 auto;padding:24px;color:#334155;">
    <div style="display:flex;align-items:center;gap:10px;margin-bottom:20px;">
      <div style="width:36px;height:36px;border-radius:8px;background:linear-gradient(135deg,#2563eb,#1e40af);color:#fff;font-size:18px;font-weight:700;text-align:center;line-height:36px;">₹</div>
      <span style="font-size:17px;font-weight:700;color:#0f172a;">Expense Tracker</span>
    </div>
    ${content}
    <p style="font-size:12px;color:#94a3b8;margin-top:28px;">You are receiving this email because of activity on your Expense Tracker account.</p>
  </div>
`;

const sendOtpEmail = async (to, name, otp) => {
  const html = layout(`
    <h2 style="color:#0f172a;font-size:19px;margin:0 0 10px;">Verify your email</h2>
    <p style="font-size:14px;line-height:1.6;">Hi ${name},</p>
    <p style="font-size:14px;line-height:1.6;">Use this one-time code to verify your Expense Tracker account. It expires in <strong>10 minutes</strong>.</p>
    <div style="background:#eff6ff;border:1px solid #dbeafe;border-radius:10px;padding:16px;text-align:center;margin:18px 0;">
      <span style="font-size:30px;font-weight:700;letter-spacing:10px;color:#1d4ed8;">${otp}</span>
    </div>
    <p style="font-size:13px;color:#64748b;">If you didn't request this, you can safely ignore this email.</p>
  `);

  await sendEmail({
    to,
    subject: `${otp} is your Expense Tracker verification code`,
    html,
    text: `Hi ${name}, your Expense Tracker verification code is ${otp}. It expires in 10 minutes.`,
  });
};

const formatINR = (value) =>
  new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(value);

const sendBudgetAlertEmail = async (to, name, { spent, budget, monthLabel, level }) => {
  const over = level >= 100;
  const title = over ? 'You have exceeded your monthly budget' : 'You are close to your monthly budget';
  const color = over ? '#dc2626' : '#d97706';
  const percent = Math.round((spent / budget) * 100);

  const html = layout(`
    <h2 style="color:${color};font-size:19px;margin:0 0 10px;">${over ? '🚨' : '⚠️'} ${title}</h2>
    <p style="font-size:14px;line-height:1.6;">Hi ${name},</p>
    <p style="font-size:14px;line-height:1.6;">Your spending in <strong>${monthLabel}</strong> has reached <strong>${percent}%</strong> of your monthly budget.</p>
    <div style="background:#f8fafc;border:1px solid #e2e8f0;border-radius:10px;padding:16px;margin:18px 0;">
      <p style="margin:0 0 6px;font-size:14px;">Spent: <strong style="color:${color};">${formatINR(spent)}</strong></p>
      <p style="margin:0;font-size:14px;">Budget: <strong>${formatINR(budget)}</strong></p>
    </div>
    <p style="font-size:13px;color:#64748b;">Open Expense Tracker to review your expenses, or adjust your budget and alerts on your profile.</p>
  `);

  await sendEmail({
    to,
    subject: `${over ? '🚨 Budget exceeded' : '⚠️ Budget warning'} — ${percent}% of your ${monthLabel} budget used`,
    html,
    text: `Hi ${name}, you have used ${percent}% (${formatINR(spent)}) of your ${formatINR(budget)} budget for ${monthLabel}.`,
  });
};

module.exports = { sendEmail, sendOtpEmail, sendBudgetAlertEmail };
