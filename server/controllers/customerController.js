const db = require("../config/db");


exports.getAllCustomers = (req, res) => {
  const sql = `
    SELECT id, name, father_name, email, phone, address, cnic, cnic_front, cnic_back, created_at
    FROM customer
    ORDER BY id DESC
  `;

  db.query(sql, (err, rows) => {
    if (err) {
      console.error("Failed to fetch customers:", err);
      return res.status(500).json({ success: false, message: "Database error" });
    }

    const customers = (rows || []).map((c) => ({
      ...c,
      cnic_front_url: c.cnic_front ? `/uploads/${c.cnic_front}` : null,
      cnic_back_url: c.cnic_back ? `/uploads/${c.cnic_back}` : null,
    }));

    return res.json({ success: true, customers });
  });
};
