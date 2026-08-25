const db = require("../config/db");
const crypto = require("crypto");

const adminTokens = new Set();


const PASSWORD_SALT = process.env.PASSWORD_SALT || "my_super_secret_salt";

function hashPassword(password) {

  return crypto
    .createHmac("sha256", PASSWORD_SALT)
    .update(password)
    .digest("hex");
}

exports.register = (req, res) => {
  const { name, email, password } = req.body;
  if (!name || !email || !password) {
    return res.status(400).json({ success: false, message: "Missing fields" });
  }
  const hashed = hashPassword(password);
  // Ensure unique email
  db.query("SELECT id FROM admin WHERE email = ?", [email], (selErr, rows) => {
    if (selErr) {
      console.error("Admin lookup failed:", selErr);
      return res.status(500).json({ success: false, message: "Database error" });
    }
    if (rows.length > 0) {
      return res.status(409).json({ success: false, message: "Admin already exists" });
    }
    const insertQuery = "INSERT INTO admin (name, email, password, created_at) VALUES (?, ?, ?, NOW())";
    db.query(insertQuery, [name, email, hashed], (insErr, result) => {
      if (insErr) {
        console.error("Admin insert failed:", insErr);
        return res.status(500).json({ success: false, message: "Failed to create admin" });
      }
      return res.json({ success: true, message: "Admin created", admin_id: result.insertId });
    });
  });
};


exports.login = (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) {
    return res.status(400).json({ success: false, message: "Email and password required" });
  }
  db.query("SELECT * FROM admin WHERE email = ?", [email], (err, results) => {
    if (err) {
      console.error("Admin query error:", err);
      return res.status(500).json({ success: false, message: "Database error" });
    }
    if (!results || results.length === 0) {
      return res.status(404).json({ success: false, message: "Admin not found" });
    }
    const admin = results[0];
    const hashed = hashPassword(password);
    if (admin.password !== hashed) {
      return res.status(401).json({ success: false, message: "Invalid credentials" });
    }
    // generate random token
    const token = crypto.randomBytes(16).toString("hex");
    adminTokens.add(token);
    return res.json({ success: true, message: "Login successful", token });
  });
};


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
  adminTokens.delete(token);
  return res.json({ success: true, message: "Logged out" });
};


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
  if (adminTokens.has(token)) {
    return next();
  }
  return res.status(401).json({ success: false, message: "Invalid or expired token" });
};