const db = require("../config/db");


function ensurePriceColumn() {
  const alterSql =
    "ALTER TABLE cars ADD COLUMN IF NOT EXISTS price_per_day INT DEFAULT 0";
  db.query(alterSql, (err) => {
   
    if (err) {
      console.warn("Could not add price_per_day column:", err.message);
    }
  });
}


ensurePriceColumn();


exports.getCarPrice = (req, res) => {
  const name = req.params.name;
  if (!name) {
    return res.status(400).json({ error: "Missing car name" });
  }
  db.query(
    "SELECT price_per_day FROM cars WHERE name = ? LIMIT 1",
    [name],
    (err, rows) => {
      if (err) {
        console.error("Error fetching car price:", err.message);
        return res.status(500).json({ error: "Database error" });
      }
      if (!rows || rows.length === 0) {
        return res.status(404).json({ error: "Car not found" });
      }
      return res.json({ price_per_day: rows[0].price_per_day });
    }
  );
};


exports.updateCarPrice = (req, res) => {
  const { name, price_per_day } = req.body;
  const price = parseInt(price_per_day, 10);
  if (!name || isNaN(price)) {
    return res
      .status(400)
      .json({ error: "Both name and numeric price_per_day are required" });
  }
  db.query(
    "UPDATE cars SET price_per_day = ? WHERE name = ?",
    [price, name],
    (err, result) => {
      if (err) {
        console.error("Error updating car price:", err.message);
        return res.status(500).json({ error: "Database error" });
      }
      if (result.affectedRows === 0) {
        return res.status(404).json({ error: "Car not found" });
      }
      return res.json({ success: true, message: "Price updated" });
    }
  );
};