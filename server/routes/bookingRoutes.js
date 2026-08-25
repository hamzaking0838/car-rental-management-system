const express = require("express");
const router = express.Router();
const multer = require("multer");
const bookingController = require("../controllers/bookingController");

// File upload config
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, "uploads/");
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + "-" + file.originalname);
  }
});

const upload = multer({ storage: storage });

// API route
router.post(
  "/create-booking",
  upload.fields([
    { name: "cnic_front" },
    { name: "cnic_back" }
  ]),
  bookingController.createBooking
);

module.exports = router;
