const db = require("../config/db");
const crypto = require("crypto");
const { sendEmail } = require("../utils/notifier");
const { passwordResetHtml } = require("../utils/notifier");


const userTokens = new Set();

const userSessions = new Map();
// In-memory storage for password reset codes. Each entry maps an email address
// to an object containing the verification code and its expiry timestamp. Codes
// expire automatically after a predefined duration (e.g., 15 minutes). This
// structure enables a simple password reset flow without persisting codes to
// the database. Note that if the server restarts, outstanding codes will be
// lost and the user must request a new one.
const resetCodes = new Map();



const PASSWORD_SALT = process.env.PASSWORD_SALT || "my_super_secret_salt";

function hashPassword(password) {
 
  return crypto
    .createHmac("sha256", PASSWORD_SALT)
    .update(password)
    .digest("hex");
}


exports.register = (req, res) => {
  const {
    name,
    father_name,
    email,
    phone,
    address,
    cnic,
    password,
  } = req.body;
  // Ensure all required fields are provided
  if (
    !name ||
    !email ||
    !password ||
    !father_name ||
    !phone ||
    !address ||
    !cnic
  ) {
    return res
      .status(400)
      .json({ success: false, message: "Missing fields" });
  }
  const hashed = hashPassword(password);
  // Check if user already exists
  db.query(
    "SELECT id FROM users WHERE email = ?",
    [email],
    (selErr, rows) => {
      if (selErr) {
        console.error("User lookup failed:", selErr);
        return res
          .status(500)
          .json({ success: false, message: "Database error" });
      }
      if (rows.length > 0) {
        return res
          .status(409)
          .json({ success: false, message: "Email already registered" });
      }
      const insert =
        `INSERT INTO users (name, father_name, email, phone, address, cnic, password, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, NOW())`;
      db.query(
        insert,
        [name, father_name, email, phone, address, cnic, hashed],
        (insErr, result) => {
          if (insErr) {
            console.error("User insert failed:", insErr);
            return res
              .status(500)
              .json({ success: false, message: "Failed to register" });
          }
          return res.json({
            success: true,
            message: "Registration successful",
            user_id: result.insertId,
          });
        }
      );
    }
  );
};


exports.login = (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) {
    return res.status(400).json({ success: false, message: "Email and password required" });
  }
  db.query("SELECT * FROM users WHERE email = ?", [email], (err, results) => {
    if (err) {
      console.error("User query error:", err);
      return res.status(500).json({ success: false, message: "Database error" });
    }
    if (!results || results.length === 0) {
      return res.status(404).json({ success: false, message: "User not found" });
    }
    const user = results[0];
    const hashed = hashPassword(password);
    if (user.password !== hashed) {
      return res.status(401).json({ success: false, message: "Invalid credentials" });
    }
    const token = crypto.randomBytes(16).toString("hex");
    userTokens.add(token);
    // Associate this token with the user id and email for later lookups
    userSessions.set(token, { userId: user.id, email: user.email });
    return res.json({
      success: true,
      message: "Login successful",
      token,
      user_id: user.id,
      name: user.name,
      email: user.email,
      father_name: user.father_name,
      phone: user.phone,
      address: user.address,
      cnic: user.cnic,
    });
  });
};

/**
 * Logout by removing the token from the set.
 */
exports.logout = (req, res) => {
  const authHeader = req.headers.authorization;
  if (!authHeader) {
    return res.status(400).json({ success: false, message: "Missing Authorization header" });
  }
  const parts = authHeader.split(" ");
  if (parts.length !== 2 || parts[0] !== "Bearer") {
    return res.status(400).json({ success: false, message: "Invalid Authorization format" });
  }
  const token = parts[1];
  userTokens.delete(token);
  userSessions.delete(token);
  return res.json({ success: true, message: "Logged out" });
};

/**
 * Middleware to verify user tokens on protected routes.
 */
exports.authenticate = (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (!authHeader) {
    return res.status(401).json({ success: false, message: "Unauthorized" });
  }
  const parts = authHeader.split(" ");
  if (parts.length !== 2 || parts[0] !== "Bearer") {
    return res.status(401).json({ success: false, message: "Unauthorized" });
  }
  const token = parts[1];
  if (userTokens.has(token)) {
    
    const session = userSessions.get(token);
    if (session) {
      req.userId = session.userId;
      req.userEmail = session.email;
    }
    return next();
  }
  return res.status(401).json({ success: false, message: "Invalid or expired token" });
};



exports.getProfile = (req, res) => {
  const userId = req.userId;
  const email = req.userEmail;
  if (!userId && !email) {
    return res.status(400).json({ success: false, message: "Missing user identity" });
  }
  const sql = userId
    ?
      "SELECT id, name, father_name, email, phone, address, cnic, created_at FROM users WHERE id = ? LIMIT 1"
    :
      "SELECT id, name, father_name, email, phone, address, cnic, created_at FROM users WHERE email = ? LIMIT 1";
  const params = [userId || email];
  db.query(sql, params, (err, rows) => {
    if (err) {
      console.error("Failed to fetch user profile:", err);
      return res.status(500).json({ success: false, message: "Database error" });
    }
    if (!rows || rows.length === 0) {
      return res.status(404).json({ success: false, message: "User not found" });
    }
    return res.json({ success: true, user: rows[0] });
  });
};


exports.updateProfile = (req, res) => {
  const userId = req.userId;
  const { name } = req.body;
  if (!userId) {
    return res.status(401).json({ success: false, message: "Unauthorized" });
  }
  if (!name || name.trim() === "") {
    return res.status(400).json({ success: false, message: "Name is required" });
  }
  db.query("UPDATE users SET name = ? WHERE id = ?", [name.trim(), userId], (err) => {
    if (err) {
      console.error("Failed to update user profile:", err);
      return res.status(500).json({ success: false, message: "Database error" });
    }
    // Update name in session if present
    for (const [token, info] of userSessions.entries()) {
      if (info.userId === userId) {
        userSessions.set(token, { ...info, name: name.trim() });
      }
    }
    return res.json({ success: true, message: "Profile updated" });
  });
};

/**
 * Reset a user's password based on their email address.
 * This endpoint allows users who have forgotten their password to set a new one.
 * It expects `email` and `new_password` in the request body.
 * Returns 404 if the user does not exist.
 */
exports.resetPassword = (req, res) => {
  const { email, code, new_password } = req.body;
  // Validate inputs
  if (!email || !code || !new_password) {
    return res.status(400).json({
      success: false,
      message: "Email, verification code and new password required",
    });
  }
  const record = resetCodes.get(email);
  // Check if a code was generated for this email
  if (!record) {
    return res.status(400).json({
      success: false,
      message: "No reset request found for this email",
    });
  }
  // Check expiry
  if (record.expires < Date.now()) {
    resetCodes.delete(email);
    return res.status(400).json({
      success: false,
      message: "Verification code expired. Please request a new one.",
    });
  }
  // Check code match
  if (record.code !== String(code).trim()) {
    return res.status(400).json({
      success: false,
      message: "Invalid verification code",
    });
  }
  // Proceed with password update
  const hashed = hashPassword(new_password);
  db.query(
    "UPDATE users SET password = ? WHERE email = ?",
    [hashed, email],
    (err, result) => {
      if (err) {
        console.error("Password reset failed:", err);
        return res.status(500).json({
          success: false,
          message: "Database error",
        });
      }
      if (!result || result.affectedRows === 0) {
        return res
          .status(404)
          .json({ success: false, message: "User not found" });
      }
      // Remove used code
      resetCodes.delete(email);
      return res.json({
        success: true,
        message: "Password reset successful",
      });
    }
  );
};

/**
 * Generate and send a password reset verification code to the user's email.
 * This endpoint initiates the password reset flow. It expects `email` in the request body.
 * If the email exists in the system, a six‑digit code is generated, stored temporarily,
 * and delivered to the user via SMTP. Codes expire after 15 minutes.
 */
exports.forgotPassword = async (req, res) => {
  const { email } = req.body;
  if (!email) {
    return res.status(400).json({
      success: false,
      message: "Email is required",
    });
  }
  // Check if user exists
  db.query(
    "SELECT id FROM users WHERE email = ?",
    [email],
    async (err, rows) => {
      if (err) {
        console.error("User lookup failed:", err);
        return res.status(500).json({
          success: false,
          message: "Database error",
        });
      }
      if (!rows || rows.length === 0) {
        // Do not reveal that the user doesn't exist to avoid user enumeration
        return res.status(200).json({
          success: true,
          message: "If an account with that email exists, a code has been sent",
        });
      }
      // Generate a 6‑digit numeric code
      const code = Math.floor(100000 + Math.random() * 900000).toString();
      // Set expiry (15 minutes from now)
      const expires = Date.now() + 15 * 60 * 1000;
      resetCodes.set(email, { code, expires });
        try {
        // Attempt to send the email with a professional HTML template.
          const htmlContent = passwordResetHtml(code, null);
          await sendEmail(
            email,
            "Your Password Reset Code",
            `Your password reset code is: ${code}\n\nThis code expires in 15 minutes.`,
            htmlContent
          );
        } catch (e) {
          console.error("Failed to send reset code email:", e.message);
        }
      return res.json({
        success: true,
        message: "Verification code sent to your email",
      });
    }
  );
};

/**
 * Verify a previously sent password reset code.
 * It expects `email` and `code` in the request body and returns whether the code is valid.
 * Useful for implementing multi‑step verification flows on the client.
 */
exports.verifyResetCode = (req, res) => {
  const { email, code } = req.body;
  if (!email || !code) {
    return res.status(400).json({
      success: false,
      message: "Email and verification code are required",
    });
  }
  const record = resetCodes.get(email);
  if (!record) {
    return res.status(400).json({
      success: false,
      message: "No reset request found for this email",
    });
  }
  if (record.expires < Date.now()) {
    resetCodes.delete(email);
    return res.status(400).json({
      success: false,
      message: "Verification code expired",
    });
  }
  if (record.code !== String(code).trim()) {
    return res.status(400).json({
      success: false,
      message: "Invalid verification code",
    });
  }
  // Optionally mark code as verified. We'll keep it stored until password is reset.
  return res.json({
    success: true,
    message: "Verification code is valid",
  });
};