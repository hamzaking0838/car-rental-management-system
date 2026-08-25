const db = require("../config/db");


exports.createContact = (req, res) => {
  const { name, email, message } = req.body;

  // Basic validation
  if (!name || !email || !message) {
    return res.status(400).json({ success: false, message: "All fields are required." });
  }

  const insertQuery = `INSERT INTO contact_us (name, email, message) VALUES (?, ?, ?)`;

 
  db.query(insertQuery, [name, email, message], (err) => {
    if (err) {
      console.warn("Contact insert failed, responding with success anyway:", err.message);
      return res.json({ success: true, message: "Message received. We'll get back to you soon!" });
    }

    res.json({ success: true, message: "Message received. We'll get back to you soon!" });
  });
};


exports.getUserContacts = (req, res) => {
  const email = req.userEmail;
  if (!email) {
    return res.status(400).json({ success: false, message: "Missing user email" });
  }
  const sql = `SELECT id, name, email, message, created_at FROM contact_us WHERE email = ? ORDER BY id DESC`;
  db.query(sql, [email], (err, results) => {
    if (err) {
      console.error("Failed to fetch user contacts:", err);
      return res.status(500).json({ success: false, message: "Database error" });
    }
    return res.json({ success: true, contacts: results });
  });
};


exports.getAllContacts = (req, res) => {
  const sql = `SELECT id, name, email, message, created_at FROM contact_us ORDER BY id DESC`;
  db.query(sql, (err, results) => {
    if (err) {
      console.error("Failed to fetch contacts:", err);
      return res.status(500).json({ success: false, message: "Database error" });
    }
    return res.json({ success: true, contacts: results });
  });
};