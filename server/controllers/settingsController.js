const db = require("../config/db");

// Non-sensitive settings that can be exposed to the frontend
const PUBLIC_KEYS = [
  "site_phone",
  "site_email",
  "site_address",
  "social_facebook",
  "social_instagram",
  "social_twitter",
];

exports.getPublicSettings = (req, res) => {
  const sql = "SELECT setting_key, setting_value FROM site_settings WHERE setting_key IN (?)";
  db.query(sql, [PUBLIC_KEYS], (err, rows) => {
    if (err) {
      console.error("Error fetching public settings:", err);
      return res.status(500).json({ success: false, message: "Database error" });
    }
    const settings = {};
    if (rows) {
      rows.forEach(row => {
        settings[row.setting_key] = row.setting_value;
      });
    }
    res.json({ success: true, settings });
  });
};

exports.getAdminSettings = (req, res) => {
  const sql = "SELECT setting_key, setting_value FROM site_settings";
  db.query(sql, (err, rows) => {
    if (err) {
      console.error("Error fetching admin settings:", err);
      return res.status(500).json({ success: false, message: "Database error" });
    }
    const settings = {};
    if (rows) {
      rows.forEach(row => {
        settings[row.setting_key] = row.setting_value;
      });
    }
    res.json({ success: true, settings });
  });
};

exports.updateSettings = (req, res) => {
  const settingsObj = req.body; // e.g. { "site_phone": "12345", "smtp_host": "..." }
  if (!settingsObj || typeof settingsObj !== 'object') {
    return res.status(400).json({ success: false, message: "Invalid payload" });
  }

  const entries = Object.entries(settingsObj);
  if (entries.length === 0) {
    return res.json({ success: true, message: "No settings to update" });
  }

  // Use connection logic to execute multiple statements sequentially
  db.getConnection((err, connection) => {
    if (err) {
      console.error("Failed to get DB connection:", err);
      return res.status(500).json({ success: false, message: "Database error" });
    }

    connection.beginTransaction(err => {
      if (err) {
        connection.release();
        return res.status(500).json({ success: false, message: "Transaction start failed" });
      }

      let queriesCompleted = 0;
      let hasError = false;

      entries.forEach(([key, value]) => {
        const sql = "INSERT INTO site_settings (setting_key, setting_value) VALUES (?, ?) ON DUPLICATE KEY UPDATE setting_value = ?";
        connection.query(sql, [key, value, value], (qErr) => {
          if (hasError) return;
          if (qErr) {
            hasError = true;
            connection.rollback(() => {
              connection.release();
              console.error("Error updating setting:", qErr);
              return res.status(500).json({ success: false, message: "Failed to update settings" });
            });
            return;
          }
          
          queriesCompleted++;
          if (queriesCompleted === entries.length && !hasError) {
            connection.commit(cErr => {
              if (cErr) {
                connection.rollback(() => {
                  connection.release();
                  return res.status(500).json({ success: false, message: "Commit failed" });
                });
              } else {
                connection.release();
                res.json({ success: true, message: "Settings updated successfully" });
              }
            });
          }
        });
      });
    });
  });
};
