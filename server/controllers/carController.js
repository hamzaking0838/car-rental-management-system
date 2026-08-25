const db = require("../config/db");


// Retrieve a list of cars for the public API.  In addition to the
// basic fields (name, color, price and availability) this endpoint
// returns the newly added specification fields: model_year, brand,
// seats, ac, fuel_type and transmission.  These fields allow the
// client‑side details page to display rich information without
// requiring an additional lookup.
exports.getCars = (req, res) => {
  // Return a list of all cars along with their specification fields and image path.
  db.query(
    `SELECT id, name, color, price_per_day, available,
            model_year, brand, seats, ac, fuel_type, transmission, image_path
       FROM cars
       ORDER BY name ASC`,
    (err, rows) => {
      if (err) {
        console.error("Error fetching cars:", err.message);
        return res.status(500).json({ error: "Database error" });
      }
      return res.json({ cars: rows });
    }
  );
};


// Return all cars for the admin panel, including the specification
// fields so that existing records can be edited with full details.
exports.getAllCarsAdmin = (req, res) => {
  // Return a list of all cars for the admin panel including the image path.
  db.query(
    `SELECT id, name, color, price_per_day, available,
            model_year, brand, seats, ac, fuel_type, transmission, image_path
       FROM cars
       ORDER BY id DESC`,
    (err, rows) => {
      if (err) {
        console.error("Error fetching cars (admin):", err.message);
        return res
          .status(500)
          .json({ success: false, message: "Database error" });
      }
      return res.json({ success: true, cars: rows });
    }
  );
};


// Create a new car record.  Accepts additional specification
// attributes (model_year, brand, seats, ac, fuel_type, transmission)
// and stores them in the cars table.  Fields left undefined will be
// stored as NULL, allowing incremental enrichment of existing data.
exports.createCarAdmin = (req, res) => {
  // Extract fields from the form body.  When using multipart/form-data the
  // fields are provided as strings in req.body and any file will be in
  // req.file.  Image filename is stored in image_path.
  const {
    name,
    color,
    price_per_day,
    available,
    model_year,
    brand,
    seats,
    ac,
    fuel_type,
    transmission
  } = req.body || {};
  const price = parseInt(price_per_day, 10);
  const avail = available === true || available === 1 || available === "1" ? 1 : 0;
  const imagePath = req.file ? req.file.filename : null;
  if (!name || isNaN(price)) {
    return res
      .status(400)
      .json({ success: false, message: "name and numeric price_per_day are required" });
  }
  const sql =
    `INSERT INTO cars (name, color, price_per_day, available,
                      model_year, brand, seats, ac, fuel_type, transmission, image_path)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`;
  db.query(
    sql,
    [
      name,
      color || null,
      price,
      avail,
      model_year || null,
      brand || null,
      seats || null,
      ac || null,
      fuel_type || null,
      transmission || null,
      imagePath || null
    ],
    (err, result) => {
      if (err) {
        console.error("Error creating car:", err.message);
        return res.status(500).json({ success: false, message: "Database error" });
      }
      return res.json({ success: true, message: "Car created", id: result.insertId });
    }
  );
};


// Update a car record.  Allows partial updates of any field,
// including the newly introduced specification columns.  Omitted
// fields remain unchanged.  If price_per_day is provided, it must
// be numeric; otherwise, it will not be updated.
exports.updateCarAdmin = (req, res) => {
  const id = parseInt(req.params.id, 10);
  const {
    name,
    color,
    price_per_day,
    available,
    model_year,
    brand,
    seats,
    ac,
    fuel_type,
    transmission
  } = req.body || {};
  const price =
    price_per_day === undefined || price_per_day === null || price_per_day === ""
      ? null
      : parseInt(price_per_day, 10);
  const avail = available === true || available === 1 || available === "1" ? 1 : 0;
  if (!id) {
    return res.status(400).json({ success: false, message: "Invalid id" });
  }
  if (price !== null && isNaN(price)) {
    return res
      .status(400)
      .json({ success: false, message: "price_per_day must be numeric" });
  }
  const fields = [];
  const vals = [];
  if (name !== undefined) {
    fields.push("name = ?");
    vals.push(name);
  }
  if (color !== undefined) {
    fields.push("color = ?");
    vals.push(color || null);
  }
  if (price !== null) {
    fields.push("price_per_day = ?");
    vals.push(price);
  }
  if (available !== undefined) {
    fields.push("available = ?");
    vals.push(avail);
  }
  if (model_year !== undefined) {
    fields.push("model_year = ?");
    vals.push(model_year || null);
  }
  if (brand !== undefined) {
    fields.push("brand = ?");
    vals.push(brand || null);
  }
  if (seats !== undefined) {
    fields.push("seats = ?");
    vals.push(seats || null);
  }
  if (ac !== undefined) {
    fields.push("ac = ?");
    vals.push(ac || null);
  }
  if (fuel_type !== undefined) {
    fields.push("fuel_type = ?");
    vals.push(fuel_type || null);
  }
  if (transmission !== undefined) {
    fields.push("transmission = ?");
    vals.push(transmission || null);
  }
  // If a new image was uploaded include it in the update.
  if (req.file) {
    fields.push("image_path = ?");
    vals.push(req.file.filename);
  }
  if (fields.length === 0) {
    return res.status(400).json({ success: false, message: "No fields to update" });
  }
  const sql = `UPDATE cars SET ${fields.join(", ")} WHERE id = ?`;
  vals.push(id);
  db.query(sql, vals, (err, result) => {
    if (err) {
      console.error("Error updating car:", err.message);
      return res.status(500).json({ success: false, message: "Database error" });
    }
    if (result.affectedRows === 0) {
      return res.status(404).json({ success: false, message: "Car not found" });
    }
    return res.json({ success: true, message: "Car updated" });
  });
};


exports.setAvailabilityAdmin = (req, res) => {
  const id = parseInt(req.params.id, 10);
  const available = req.body?.available;
  const avail = available === true || available === 1 || available === "1" ? 1 : 0;
  if (!id) {
    return res.status(400).json({ success: false, message: "Invalid id" });
  }
  db.query("UPDATE cars SET available = ? WHERE id = ?", [avail, id], (err, result) => {
    if (err) {
      console.error("Error updating availability:", err.message);
      return res.status(500).json({ success: false, message: "Database error" });
    }
    if (result.affectedRows === 0) {
      return res.status(404).json({ success: false, message: "Car not found" });
    }
    return res.json({ success: true, message: "Availability updated" });
  });
};


exports.deleteCarAdmin = (req, res) => {
  const id = parseInt(req.params.id, 10);
  if (!id) {
    return res.status(400).json({ success: false, message: "Invalid id" });
  }
  db.query("DELETE FROM cars WHERE id = ?", [id], (err, result) => {
    if (err) {
      console.error("Error deleting car:", err.message);
      return res.status(500).json({ success: false, message: "Database error. Car may be referenced by bookings." });
    }
    if (result.affectedRows === 0) {
      return res.status(404).json({ success: false, message: "Car not found" });
    }
    return res.json({ success: true, message: "Car deleted" });
  });
};

/*
 * Get details of a specific car by its ID.  Returns all fields,
 * including the specification columns.  If the car is not found
 * the endpoint returns a 404 status.
 */
exports.getCarById = (req, res) => {
  const id = parseInt(req.params.id, 10);
  if (!id) {
    return res.status(400).json({ success: false, message: "Invalid id" });
  }
  db.query(
    `SELECT id, name, color, price_per_day, available,
            model_year, brand, seats, ac, fuel_type, transmission, image_path
       FROM cars WHERE id = ?`,
    [id],
    (err, rows) => {
      if (err) {
        console.error("Error fetching car by id:", err.message);
        return res.status(500).json({ success: false, message: "Database error" });
      }
      if (rows.length === 0) {
        return res.status(404).json({ success: false, message: "Car not found" });
      }
      return res.json({ success: true, car: rows[0] });
    }
  );
};

/*
 * Check the availability of a car on the current date.  This
 * endpoint queries the bookings table to determine if the car is
 * currently booked (i.e. if there exists a booking whose pickup
 * date plus duration covers today).  If the car is booked, the
 * response includes the date until which it remains unavailable.
 */
exports.getCarAvailability = (req, res) => {
  const id = parseInt(req.params.id, 10);
  if (!id) {
    return res.status(400).json({ success: false, message: "Invalid id" });
  }
  // Determine if there is an overlapping booking for today. Return the end date
  // already formatted as YYYY/MM/DD and include duration_days so the frontend can
  // show text like: No (until 2026/04/27, 2 days).
  const sql = `
    SELECT 
      pickup_date,
      duration_days,
      DATE_FORMAT(DATE_ADD(pickup_date, INTERVAL duration_days DAY), '%Y/%m/%d') AS booked_until
    FROM booking
    WHERE car_id = ?
      AND status IN ('Pending', 'Confirmed')
      AND pickup_date <= CURRENT_DATE()
      AND DATE_ADD(pickup_date, INTERVAL duration_days DAY) > CURRENT_DATE()
    ORDER BY DATE_ADD(pickup_date, INTERVAL duration_days DAY) ASC
    LIMIT 1
  `;
  db.query(sql, [id], (err, rows) => {
    if (err) {
      console.error("Error checking availability:", err.message);
      return res.status(500).json({ success: false, message: "Database error" });
    }
    if (rows && rows.length > 0) {
      const result = rows[0];
      return res.json({
        success: true,
        available: false,
        until: result.booked_until,
        days: Number(result.duration_days || 0)
      });
    }
    return res.json({ success: true, available: true });
  });
};