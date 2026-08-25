const express = require("express");
const router = express.Router();
const adminController = require("../controllers/adminController");
const bookingController = require("../controllers/bookingController");
const contactController = require("../controllers/contactController");
const carController = require("../controllers/carController");
const customerController = require("../controllers/customerController");
const paymentController = require("../controllers/paymentController");

// Multer setup for car image uploads.  Images are stored in the
// `uploads/` directory and served as static files.  Filenames are
// timestamped to avoid collisions.
const multer = require('multer');
const path = require('path');

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    // Store car images alongside other uploads in server/uploads.  This path is
    // relative to this route file, so '../uploads' resolves to
    // project_availability/server/uploads.
    cb(null, path.join(__dirname, '../uploads'));
  },
  filename: function (req, file, cb) {
    const ext = path.extname(file.originalname);
    const base = path.basename(file.originalname, ext);
    cb(null, `${base}-${Date.now()}${ext}`);
  }
});

const carUpload = multer({ storage });


router.post("/register", adminController.register);

// POST /api/admin/login
router.post("/login", adminController.login);

// POST /api/admin/logout
router.post("/logout", adminController.logout);


router.get("/verify", adminController.authenticate, (req, res) => {
  res.json({ success: true, message: "Admin token valid" });
});

//  retrieve all bookings (admin only)
router.get(
  "/bookings",
  adminController.authenticate,
  bookingController.getAllBookings
);

//  update booking status
router.put(
  "/bookings/:id/status",
  adminController.authenticate,
  bookingController.updateBookingStatus
);

//  retrieve all contact messages (admin only)
router.get(
  "/contacts",
  adminController.authenticate,
  contactController.getAllContacts
);

// retrieve all customers (admin only)
router.get(
  "/customers",
  adminController.authenticate,
  customerController.getAllCustomers
);

//  list all payments (admin only)
router.get(
  "/payments",
  adminController.authenticate,
  paymentController.getAllPaymentsAdmin
);

// ===== Cars CRUD (Admin) =====
// list all cars
router.get("/cars", adminController.authenticate, carController.getAllCarsAdmin);

// create a new car
// When creating a car, accept an optional image file.  The multer
// middleware will populate req.file with the uploaded file.
router.post(
  "/cars",
  adminController.authenticate,
  carUpload.single('image'),
  carController.createCarAdmin
);

//  update car fields
// For updates, also allow uploading a new image file.  If no file is
// provided then the existing image remains unchanged.
router.put(
  "/cars/:id",
  adminController.authenticate,
  carUpload.single('image'),
  carController.updateCarAdmin
);

//  toggle availability
router.patch(
  "/cars/:id/availability",
  adminController.authenticate,
  carController.setAvailabilityAdmin
);

// delete a car
router.delete("/cars/:id", adminController.authenticate, carController.deleteCarAdmin);

module.exports = router;