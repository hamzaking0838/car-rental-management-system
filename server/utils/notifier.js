const nodemailer = require('nodemailer');
const db = require('../config/db');

async function getSettingsFromDb() {
  return new Promise((resolve) => {
    db.query("SELECT setting_key, setting_value FROM site_settings", (err, rows) => {
      const config = {};
      if (!err && rows) {
        rows.forEach(r => config[r.setting_key] = r.setting_value);
      }
      resolve(config);
    });
  });
}

async function getTwilioClient(config) {
  const sid = config.twilio_account_sid || process.env.TWILIO_ACCOUNT_SID;
  const token = config.twilio_auth_token || process.env.TWILIO_AUTH_TOKEN;
  if (!sid || !token) return null;
  try {
    const twilio = require('twilio');
    return twilio(sid, token);
  } catch (e) {
    return null;
  }
}

function canEmail(config) {
  const host = config.smtp_host || process.env.SMTP_HOST;
  const user = config.smtp_user || process.env.SMTP_USER;
  const pass = config.smtp_pass || process.env.SMTP_PASS;
  return !!(host && user && pass);
}

function makeTransporter(config) {
  const host = config.smtp_host || process.env.SMTP_HOST;
  const port = parseInt(config.smtp_port || process.env.SMTP_PORT || '587', 10);
  const secureStr = config.smtp_secure || process.env.SMTP_SECURE || '';
  const secure = secureStr.toLowerCase() === 'true' || port === 465;
  const user = config.smtp_user || process.env.SMTP_USER;
  const pass = config.smtp_pass || process.env.SMTP_PASS;
  return nodemailer.createTransport({ host, port, secure, auth: { user, pass } });
}

/* ─────────────────────────────────────────────
   EMAIL TEMPLATE: Booking Received
   Sent immediately when customer submits booking
───────────────────────────────────────────── */
function bookingReceivedHtml(customerName, bookingId, siteName) {
  const name = siteName || 'AutoNest';
  return `<!DOCTYPE html>
<html>
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#f2f4f7;font-family:Arial,Helvetica,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f2f4f7;padding:40px 0;">
    <tr><td align="center">
      <table width="580" cellpadding="0" cellspacing="0" style="background:#fff;border-radius:10px;overflow:hidden;box-shadow:0 4px 16px rgba(0,0,0,0.08);">

        <!-- Header -->
        <tr>
          <td style="background:linear-gradient(135deg,#0dcaf0,#0892aa);padding:32px 40px;text-align:center;">
            <h1 style="margin:0;color:#fff;font-size:26px;font-weight:700;letter-spacing:1px;">${name}</h1>
            <p style="margin:6px 0 0;color:rgba(255,255,255,0.85);font-size:13px;">Car Rental Service</p>
          </td>
        </tr>

        <!-- Icon Row -->
        <tr>
          <td align="center" style="padding:32px 40px 0;">
            <div style="width:64px;height:64px;background:#e0f7fa;border-radius:50%;display:inline-flex;align-items:center;justify-content:center;margin-bottom:16px;">
              <span style="font-size:30px;">📋</span>
            </div>
            <h2 style="margin:0;color:#1a1a2e;font-size:22px;font-weight:700;">Booking Request Received</h2>
          </td>
        </tr>

        <!-- Body -->
        <tr>
          <td style="padding:24px 40px 32px;">
            <p style="color:#444;font-size:15px;line-height:1.8;margin:0 0 16px;">
              Dear <strong>${customerName}</strong>,
            </p>
            <p style="color:#444;font-size:15px;line-height:1.8;margin:0 0 20px;">
              Thank you for your booking. We have received your request and it is currently <strong>under review</strong>.
            </p>
            <p style="color:#444;font-size:15px;line-height:1.8;margin:0 0 24px;">
              Our team will verify your booking details and send you a confirmation email shortly.
            </p>

            <!-- Booking Ref Box -->
            <table width="100%" cellpadding="0" cellspacing="0" style="background:#f8f9fa;border-left:4px solid #0dcaf0;border-radius:0 6px 6px 0;padding:16px 20px;margin-bottom:28px;">
              <tr>
                <td>
                  <p style="margin:0;color:#888;font-size:12px;text-transform:uppercase;letter-spacing:1px;">Booking Reference</p>
                  <p style="margin:4px 0 0;color:#1a1a2e;font-size:20px;font-weight:700;">#${bookingId}</p>
                </td>
                <td align="right">
                  <span style="background:#fff3cd;color:#856404;padding:5px 14px;border-radius:20px;font-size:12px;font-weight:600;border:1px solid #ffc107;">Under Review</span>
                </td>
              </tr>
            </table>

            <p style="color:#666;font-size:14px;line-height:1.7;margin:0 0 6px;">
              If you have any questions or need assistance, feel free to contact us.
            </p>
            <p style="color:#444;font-size:14px;margin:0;">
              Warm regards,<br>
              <strong>${name} Team</strong>
            </p>
          </td>
        </tr>

        <!-- Footer -->
        <tr>
          <td style="background:#f8f9fa;padding:18px 40px;text-align:center;border-top:1px solid #e9ecef;">
            <p style="color:#bbb;font-size:12px;margin:0;">This is an automated email. Please do not reply to this message.</p>
          </td>
        </tr>

      </table>
    </td></tr>
  </table>
</body>
</html>`;
}

/* ─────────────────────────────────────────────
   EMAIL TEMPLATE: Booking Approved/Confirmed
   Sent when admin confirms the booking
───────────────────────────────────────────── */
function bookingApprovedHtml(customerName, bookingId, carName, pickupDate, pickupTime, siteName) {
  const name = siteName || 'AutoNest';
  const formattedDate = pickupDate ? String(pickupDate).replace(/-/g, '/') : 'As scheduled';
  const formattedTime = pickupTime || '';
  return `<!DOCTYPE html>
<html>
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#f2f4f7;font-family:Arial,Helvetica,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f2f4f7;padding:40px 0;">
    <tr><td align="center">
      <table width="580" cellpadding="0" cellspacing="0" style="background:#fff;border-radius:10px;overflow:hidden;box-shadow:0 4px 16px rgba(0,0,0,0.08);">

        <!-- Header -->
        <tr>
          <td style="background:linear-gradient(135deg,#0dcaf0,#0892aa);padding:32px 40px;text-align:center;">
            <h1 style="margin:0;color:#fff;font-size:26px;font-weight:700;letter-spacing:1px;">${name}</h1>
            <p style="margin:6px 0 0;color:rgba(255,255,255,0.85);font-size:13px;">Car Rental Service</p>
          </td>
        </tr>

        <!-- Icon Row -->
        <tr>
          <td align="center" style="padding:32px 40px 0;">
            <div style="width:64px;height:64px;background:#d1fae5;border-radius:50%;display:inline-flex;align-items:center;justify-content:center;margin-bottom:16px;">
              <span style="font-size:30px;">✅</span>
            </div>
            <h2 style="margin:0;color:#1a1a2e;font-size:22px;font-weight:700;">Booking Approved!</h2>
          </td>
        </tr>

        <!-- Body -->
        <tr>
          <td style="padding:24px 40px 32px;">
            <p style="color:#444;font-size:15px;line-height:1.8;margin:0 0 16px;">
              Dear <strong>${customerName}</strong>,
            </p>
            <p style="color:#444;font-size:15px;line-height:1.8;margin:0 0 24px;">
              We are pleased to inform you that your booking has been <strong>approved</strong> successfully.
            </p>

            <!-- Booking Details Box -->
            <table width="100%" cellpadding="0" cellspacing="0" style="background:#f8f9fa;border-radius:8px;margin-bottom:24px;overflow:hidden;">
              <tr>
                <td colspan="2" style="background:#0dcaf0;padding:12px 20px;">
                  <p style="margin:0;color:#fff;font-size:13px;font-weight:600;text-transform:uppercase;letter-spacing:1px;">Booking Details</p>
                </td>
              </tr>
              <tr>
                <td style="padding:14px 20px;color:#666;font-size:14px;border-bottom:1px solid #e9ecef;width:45%;">Booking Reference</td>
                <td style="padding:14px 20px;color:#1a1a2e;font-size:14px;font-weight:700;border-bottom:1px solid #e9ecef;">#${bookingId}</td>
              </tr>
              <tr>
                <td style="padding:14px 20px;color:#666;font-size:14px;border-bottom:1px solid #e9ecef;">Vehicle</td>
                <td style="padding:14px 20px;color:#1a1a2e;font-size:14px;font-weight:600;border-bottom:1px solid #e9ecef;">${carName || 'Your selected vehicle'}</td>
              </tr>
              <tr>
                <td style="padding:14px 20px;color:#666;font-size:14px;border-bottom:1px solid #e9ecef;">Pickup Date</td>
                <td style="padding:14px 20px;color:#1a1a2e;font-size:14px;font-weight:600;border-bottom:1px solid #e9ecef;">${formattedDate}</td>
              </tr>
              <tr>
                <td style="padding:14px 20px;color:#666;font-size:14px;">Pickup Time</td>
                <td style="padding:14px 20px;color:#1a1a2e;font-size:14px;font-weight:600;">${formattedTime}</td>
              </tr>
            </table>

            <!-- Instructions Box -->
            <table width="100%" cellpadding="0" cellspacing="0" style="background:#fff8e1;border:1px solid #ffe082;border-radius:8px;padding:16px 20px;margin-bottom:24px;">
              <tr>
                <td>
                  <p style="margin:0 0 10px;color:#5d4037;font-size:14px;font-weight:700;">📌 Important — Please Bring at Pickup:</p>
                  <p style="margin:0 0 6px;color:#5d4037;font-size:14px;">• Valid CNIC or Passport</p>
                  <p style="margin:0;color:#5d4037;font-size:14px;">• Driving License</p>
                </td>
              </tr>
            </table>

            <p style="color:#444;font-size:14px;line-height:1.7;margin:0 0 20px;">
              Thank you for choosing <strong>${name}</strong>. We look forward to serving you and wish you a safe and enjoyable journey.
            </p>
            <p style="color:#444;font-size:14px;margin:0;">
              Best Regards,<br>
              <strong>${name} Team</strong>
            </p>
          </td>
        </tr>

        <!-- Footer -->
        <tr>
          <td style="background:#f8f9fa;padding:18px 40px;text-align:center;border-top:1px solid #e9ecef;">
            <p style="color:#bbb;font-size:12px;margin:0;">This is an automated email. Please do not reply to this message.</p>
          </td>
        </tr>

      </table>
    </td></tr>
  </table>
</body>
</html>`;
}

/* ─────────────────────────────────────────────
   EMAIL TEMPLATE: Password Reset OTP
───────────────────────────────────────────── */
function passwordResetHtml(code, siteName) {
  const name = siteName || 'AutoNest';
  return `<!DOCTYPE html>
<html>
<head><meta charset="UTF-8"></head>
<body style="margin:0;padding:0;background:#f2f4f7;font-family:Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f2f4f7;padding:40px 0;">
    <tr><td align="center">
      <table width="580" cellpadding="0" cellspacing="0" style="background:#fff;border-radius:10px;overflow:hidden;box-shadow:0 4px 16px rgba(0,0,0,0.08);">
        <tr>
          <td style="background:linear-gradient(135deg,#0dcaf0,#0892aa);padding:32px 40px;text-align:center;">
            <h1 style="margin:0;color:#fff;font-size:26px;font-weight:700;">${name}</h1>
            <p style="margin:6px 0 0;color:rgba(255,255,255,0.85);font-size:13px;">Car Rental Service</p>
          </td>
        </tr>
        <tr>
          <td style="padding:36px 40px;">
            <h2 style="color:#1a1a2e;font-size:20px;margin:0 0 12px;">Password Reset Request</h2>
            <p style="color:#555;font-size:15px;line-height:1.7;margin:0 0 24px;">
              We received a request to reset your account password. Use the code below to continue.
            </p>
            <div style="text-align:center;margin:0 0 28px;">
              <div style="display:inline-block;background:#e0f7fa;border:2px dashed #0dcaf0;border-radius:10px;padding:20px 48px;">
                <p style="margin:0;color:#888;font-size:11px;letter-spacing:2px;text-transform:uppercase;">Verification Code</p>
                <p style="margin:10px 0 0;color:#0892aa;font-size:38px;font-weight:800;letter-spacing:10px;">${code}</p>
              </div>
            </div>
            <p style="color:#555;font-size:14px;margin:0 0 8px;">This code is valid for <strong>15 minutes</strong>. Do not share it with anyone.</p>
            <p style="color:#999;font-size:13px;margin:0;">If you did not request this, simply ignore this email.</p>
          </td>
        </tr>
        <tr>
          <td style="background:#f8f9fa;padding:18px 40px;text-align:center;border-top:1px solid #e9ecef;">
            <p style="color:#bbb;font-size:12px;margin:0;">This is an automated email. Please do not reply.</p>
          </td>
        </tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`;
}

async function sendEmail(to, subject, text, htmlContent) {
  const config = await getSettingsFromDb();
  if (!canEmail(config)) return { ok: false, skipped: true, reason: 'SMTP not configured' };
  const from = config.smtp_from || process.env.SMTP_FROM || config.smtp_user || process.env.SMTP_USER;
  const transporter = makeTransporter(config);
  const mailOptions = { from, to, subject };
  if (htmlContent) {
    mailOptions.html = htmlContent;
    mailOptions.text = text;
  } else {
    mailOptions.text = text;
  }
  await transporter.sendMail(mailOptions);
  return { ok: true };
}

async function sendSms(to, text) {
  const config = await getSettingsFromDb();
  const from = config.twilio_from || process.env.TWILIO_FROM;
  const client = await getTwilioClient(config);
  if (!client || !from) return { ok: false, skipped: true, reason: 'Twilio not configured' };
  await client.messages.create({ from, to, body: text });
  return { ok: true };
}

/**
 * Send "Booking Received" email immediately after customer submits booking.
 */
async function notifyBookingReceived({ bookingId, customerName, email }) {
  const config = await getSettingsFromDb();
  const siteName = config.site_name || 'AutoNest';
  try {
    if (!email) return { ok: false, skipped: true, reason: 'No email' };
    const html = bookingReceivedHtml(customerName, bookingId, siteName);
    const plain = `Dear ${customerName},\n\nThank you for your booking (Ref: #${bookingId}). We have received your request and it is currently under review.\n\nOur team will verify your booking and send you a confirmation email shortly.\n\n${siteName} Team`;
    return await sendEmail(email, 'Booking Received – ' + siteName, plain, html);
  } catch (e) {
    console.warn('Booking received notification failed:', e.message);
    return { ok: false, error: e.message };
  }
}

/**
 * Send "Booking Approved" email when admin confirms booking.
 */
async function notifyBookingConfirmed({ bookingId, customerName, email, phone, carName, pickupDate, pickupTime }) {
  const config = await getSettingsFromDb();
  const siteName = config.site_name || 'AutoNest';
  const summary = { email: null, sms: null };

  // Email
  try {
    if (email) {
      const html = bookingApprovedHtml(customerName, bookingId, carName, pickupDate, pickupTime, siteName);
      const plain = `Dear ${customerName},\n\nYour booking (#${bookingId}) has been approved.\nVehicle: ${carName || 'Your selected vehicle'}\nPickup: ${pickupDate || ''} ${pickupTime || ''}\n\nPlease bring your CNIC and Driving License at pickup.\n\nBest Regards,\n${siteName} Team`;
      summary.email = await sendEmail(email, `Booking Approved – #${bookingId}`, plain, html);
    } else {
      summary.email = { ok: false, skipped: true, reason: 'No email' };
    }
  } catch (e) {
    summary.email = { ok: false, error: e.message };
  }

  // SMS
  try {
    if (phone) {
      const smsText = `${siteName}: Your booking #${bookingId} has been approved! Vehicle: ${carName || 'your selected car'}. Pickup: ${pickupDate || ''} ${pickupTime || ''}. Bring CNIC & Driving License.`;
      summary.sms = await sendSms(phone, smsText);
    } else {
      summary.sms = { ok: false, skipped: true, reason: 'No phone' };
    }
  } catch (e) {
    summary.sms = { ok: false, error: e.message };
  }

  return summary;
}

module.exports = { notifyBookingReceived, notifyBookingConfirmed, sendEmail, passwordResetHtml };
