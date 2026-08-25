const db = require("../config/db");
const fs = require("fs");
const path = require("path");
const { notifyBookingConfirmed, notifyBookingReceived } = require("../utils/notifier");


try {
  db.query(
    "ALTER TABLE booking ADD COLUMN IF NOT EXISTS status VARCHAR(20) DEFAULT 'Pending'",
    (err) => {
      if (err) {
        console.warn("Could not ensure booking.status column:", err.message);
      }
    }
  );
} catch (e) {

}

exports.createBooking = (req, res) => {

  const {
    name,
    father_name,
    email,
    phone,
    address,
    cnic,
    car_id,
    color,
    driver_option,
    pickup_date,
    pickup_time,
    duration_days,
    notes
  } = req.body;

  // Normalize pickup date to MySQL's standard YYYY-MM-DD format before saving.
  // The admin/user UI can later display it as YYYY/MM/DD.
  const pickupDateForDb = pickup_date ? String(pickup_date).slice(0, 10) : null;

 
  let cnic_front = req.files?.["cnic_front"]?.[0]?.filename || null;
  let cnic_back = req.files?.["cnic_back"]?.[0]?.filename || null;


  const slugify = (val) => {
    return String(val || "user")
      .trim()
      .toLowerCase()
      .replace(/\s+/g, "_")
      .replace(/[^a-z0-9_]/g, '') || 'user';
  };
  try {
   
    const nameSlug = slugify(name);
    const uploadsDir = path.join(__dirname, "../uploads");
   
    if (cnic_front) {
      const oldPath = path.join(uploadsDir, cnic_front);
      const ext = path.extname(cnic_front);
      const newName = `${nameSlug}_cnic_front_${Date.now()}${ext}`;
      const newPath = path.join(uploadsDir, newName);
      try {
        fs.renameSync(oldPath, newPath);
        cnic_front = newName;
      } catch (e) {
        console.warn('Failed to rename CNIC front file:', e.message);
      }
    }
    if (cnic_back) {
      const oldPath = path.join(uploadsDir, cnic_back);
      const ext = path.extname(cnic_back);
      const newName = `${nameSlug}_cnic_back_${Date.now()}${ext}`;
      const newPath = path.join(uploadsDir, newName);
      try {
        fs.renameSync(oldPath, newPath);
        cnic_back = newName;
      } catch (e) {
        console.warn('Failed to rename CNIC back file:', e.message);
      }
    }
  } catch (renameErr) {
    console.warn('Error occurred while renaming CNIC files:', renameErr.message);
  
  }


  const saveLocal = () => {
    try {
      const uploadsDir = path.join(__dirname, "../uploads");
      if (!fs.existsSync(uploadsDir)) {
        fs.mkdirSync(uploadsDir, { recursive: true });
      }
      const jsonPath = path.join(uploadsDir, "bookings.json");
      let data = [];
      if (fs.existsSync(jsonPath)) {
        try {
          const raw = fs.readFileSync(jsonPath, "utf8");
          data = JSON.parse(raw);
        } catch {
         
          data = [];
        }
      }
      const bookingId = data.length + 1;
      const record = {
        id: bookingId,
        name,
        father_name,
        email,
        phone,
        address,
        cnic,
        cnic_front,
        cnic_back,
        car_id,
        color,
        driver_option,
        pickup_date: pickupDateForDb,
        pickup_time,
        duration_days,
        notes,
        created_at: new Date().toISOString()
      };
      data.push(record);
      fs.writeFileSync(jsonPath, JSON.stringify(data, null, 2));
      return res.json({ success: true, message: "Booking saved locally (simulation)", booking_id: bookingId });
    } catch (fileErr) {
      console.error("Failed to save booking locally:", fileErr);
      return res.status(500).json({ success: false, message: "Unable to save booking." });
    }
  };


  const customerQuery = `
    INSERT INTO customer 
      (name, father_name, email, phone, address, cnic, cnic_front, cnic_back)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `;

  db.query(
    customerQuery,
    [name, father_name, email, phone, address, cnic, cnic_front, cnic_back],
    (custErr, customerResult) => {
      const handleBooking = (customerId) => {
       
        const carName = car_id;
        db.query('SELECT id FROM cars WHERE name = ?', [carName], (carSelErr, carRows) => {
          if (carSelErr) {
            console.warn('Car lookup failed, falling back to local file:', carSelErr.message);
            return saveLocal();
          }
          if (!carRows || carRows.length === 0) {
            // Car not found; do not create duplicates.  Save locally instead.
            console.warn('Selected car not found in database; saving booking locally to avoid duplicate car entries');
            return saveLocal();
          }
          const resolvedCarId = carRows[0].id;
        
          try {
            const newStart = new Date(pickupDateForDb);
            const newEnd = new Date(pickupDateForDb);
            newEnd.setDate(newEnd.getDate() + parseInt(duration_days) - 1);
            const pad = (n) => (n < 10 ? '0' + n : String(n));
            const formatDate = (d) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
            const newStartStr = formatDate(newStart);
            const newEndStr = formatDate(newEnd);
            const availabilitySql = `
              SELECT id FROM booking
              WHERE car_id = ?
                AND status IN ('Pending', 'Confirmed')
                AND pickup_date <= ?
                AND DATE_ADD(pickup_date, INTERVAL duration_days - 1 DAY) >= ?
              LIMIT 1
            `;
            db.query(availabilitySql, [resolvedCarId, newEndStr, newStartStr], (availErr, availRows) => {
              if (availErr) {
                console.warn('Availability check failed, falling back to local file:', availErr.message);
                return saveLocal();
              }
              if (availRows && availRows.length > 0) {
              
                return res.json({ success: false, message: 'Selected car is not available for the chosen dates. Please pick a different date or car.' });
              }
              // No overlap; proceed to create booking.
              const bookingQuery = `
                INSERT INTO booking 
                  (customer_id, car_id, color, driver_option, pickup_date, pickup_time, duration_days, notes, created_at)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, NOW())
              `;
              db.query(
                bookingQuery,
                [
                  customerId,
                  resolvedCarId,
                  color || null,
                  driver_option || null,
                  pickupDateForDb,
                  pickup_time,
                  duration_days,
                  notes
                ],
                (bookErr, bookingResult) => {
                  if (bookErr) {
                    console.warn('Booking insert failed, falling back to local file:', bookErr.message);
                    return saveLocal();
                  }
                  const newBookingId = bookingResult.insertId;
                  // Send "Booking Received" email to customer immediately
                  notifyBookingReceived({
                    bookingId: newBookingId,
                    customerName: name,
                    email: email || null
                  }).catch(e => console.warn('Booking received email failed:', e.message));
                  return res.json({ success: true, message: 'Booking created successfully', booking_id: newBookingId });
                }
              );
            });
          } catch (dateErr) {
            console.warn('Failed to compute availability dates:', dateErr.message);
            return saveLocal();
          }
        });
      };

      if (custErr) {
      
        if (custErr.code === 'ER_DUP_ENTRY' || custErr.message.includes('Duplicate entry')) {
        
          db.query('SELECT id FROM customer WHERE email = ?', [email], (selErr, rows) => {
            if (selErr || !rows || rows.length === 0) {
              console.warn('Could not retrieve existing customer after duplicate email error:', selErr?.message);
              return saveLocal();
            }
            const existingCustomerId = rows[0].id;
           
            const updateSql = `
              UPDATE customer
              SET name = ?, father_name = ?, phone = ?, address = ?, cnic = ?, cnic_front = ?, cnic_back = ?
              WHERE id = ?
            `;
            db.query(updateSql, [name, father_name, phone, address, cnic, cnic_front, cnic_back, existingCustomerId], (updErr) => {
              if (updErr) {
                console.warn('Failed to update existing customer record:', updErr.message);
           
              }
              handleBooking(existingCustomerId);
            });
          });
        } else {
          console.warn('Customer insert failed, falling back to local file:', custErr.message);
          return saveLocal();
        }
        return;
      }
     
      handleBooking(customerResult.insertId);
    }
  );
};


exports.getUserBookings = (req, res) => {
  const email = req.userEmail;
  if (!email) {
    return res.status(400).json({ success: false, message: "Missing user email" });
  }
  const sql = `
    SELECT 
      b.id AS booking_id,
      c.name AS customer_name,
      c.email AS customer_email,
      c.phone AS customer_phone,
      cars.name AS car_name,
      COALESCE(b.color, cars.color) AS car_color,
      b.driver_option AS driver_option,
      DATE_FORMAT(b.pickup_date, '%Y/%m/%d') AS pickup_date,
      b.pickup_time,
      b.duration_days,
      b.notes,
      b.status,
      b.created_at AS booking_created_at
    FROM booking b
    JOIN customer c ON b.customer_id = c.id
    JOIN cars ON b.car_id = cars.id
    WHERE c.email = ?
    ORDER BY b.id DESC
  `;
  db.query(sql, [email], (err, results) => {
    if (err) {
      console.error("Failed to fetch user bookings:", err);
      return res.status(500).json({ success: false, message: "Database error" });
    }
    return res.json({ success: true, bookings: results });
  });
};


exports.cancelUserBooking = (req, res) => {
  const bookingId = parseInt(req.params.id, 10);
  const email = req.userEmail;
  if (!email || !bookingId) {
    return res.status(400).json({ success: false, message: "Missing booking id or user" });
  }

  const sql = `
    UPDATE booking b
    JOIN customer c ON b.customer_id = c.id
    SET b.status = 'Cancelled'
    WHERE b.id = ? AND c.email = ?
  `;
  db.query(sql, [bookingId, email], (err, result) => {
    if (err) {
      console.error('Error cancelling booking:', err.message);
      return res.status(500).json({ success: false, message: 'Database error' });
    }
    if (result.affectedRows === 0) {
      return res.status(404).json({ success: false, message: 'Booking not found or unauthorized' });
    }
    return res.json({ success: true, message: 'Booking cancelled' });
  });
};


exports.getAllBookings = (req, res) => {
  const sql = `
    SELECT 
      b.id AS booking_id,
      b.status AS booking_status,
      c.name AS customer_name,
      c.email AS customer_email,
      c.phone AS customer_phone,
      cars.name AS car_name,
      COALESCE(b.color, cars.color) AS car_color,
      b.driver_option AS driver_option,
      DATE_FORMAT(b.pickup_date, '%Y/%m/%d') AS pickup_date,
      b.pickup_time,
      b.duration_days,
      b.notes,
      b.created_at AS booking_created_at,
      p.status AS payment_status,
      p.amount AS payment_amount,
      p.payment_method AS payment_method,
      p.payment_date AS payment_date,
      p.stripe_payment_intent_id AS stripe_payment_intent_id
    FROM booking b
    JOIN customer c ON b.customer_id = c.id
    JOIN cars ON b.car_id = cars.id
    LEFT JOIN (
      SELECT p1.*
      FROM payment p1
      JOIN (
        SELECT booking_id, MAX(id) AS max_id
        FROM payment
        GROUP BY booking_id
      ) latest ON latest.booking_id = p1.booking_id AND latest.max_id = p1.id
    ) p ON p.booking_id = b.id
    ORDER BY b.id DESC
  `;
  db.query(sql, (err, results) => {
    if (err) {
      console.error("Failed to fetch all bookings:", err);
      return res.status(500).json({ success: false, message: "Database error" });
    }
    return res.json({ success: true, bookings: results });
  });
};


exports.updateBookingStatus = (req, res) => {
  const bookingId = req.params.id;
  const { status } = req.body || {};
  const allowed = ["Pending", "Confirmed", "Completed", "Cancelled"];
  if (!bookingId) {
    return res.status(400).json({ success: false, message: "Missing booking id" });
  }
  if (!status || !allowed.includes(status)) {
    return res.status(400).json({ success: false, message: "Invalid status" });
  }

  db.query(
    "UPDATE booking SET status = ? WHERE id = ?",
    [status, bookingId],
    async (err, result) => {
      if (err) {
        console.error("Failed to update booking status:", err);
        return res.status(500).json({ success: false, message: "Database error" });
      }
      if (!result.affectedRows) {
        return res.status(404).json({ success: false, message: "Booking not found" });
      }

     
      let notification = null;
      if (status === "Confirmed") {
        try {
          const infoSql = `
            SELECT c.name AS customer_name, c.email AS email, c.phone AS phone,
                   cars.name AS car_name,
                   DATE_FORMAT(b.pickup_date, '%d %M %Y') AS pickup_date,
                   b.pickup_time
            FROM booking b
            JOIN customer c ON b.customer_id = c.id
            JOIN cars ON b.car_id = cars.id
            WHERE b.id = ?
            LIMIT 1
          `;
          const customerInfo = await new Promise((resolve, reject) => {
            db.query(infoSql, [bookingId], (e2, rows) => {
              if (e2) return reject(e2);
              resolve(rows && rows[0] ? rows[0] : null);
            });
          });

          notification = await notifyBookingConfirmed({
            bookingId,
            customerName: customerInfo?.customer_name || 'Customer',
            email: customerInfo?.email || null,
            phone: customerInfo?.phone || null,
            carName: customerInfo?.car_name || null,
            pickupDate: customerInfo?.pickup_date || null,
            pickupTime: customerInfo?.pickup_time || null,
          });
        } catch (e) {
          console.warn("Notification failed:", e.message);
          notification = { error: e.message };
        }
      }

      return res.json({ success: true, message: "Status updated", notification });
    }
  );
};
