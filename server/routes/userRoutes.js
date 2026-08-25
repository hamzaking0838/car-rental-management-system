const express = require("express");
const router = express.Router();
const userController = require("../controllers/userController");
const bookingController = require("../controllers/bookingController");
const contactController = require("../controllers/contactController");

// create a new user
router.post("/register", userController.register);

//  log in a user
router.post("/login", userController.login);

// reset password for a user who forgot their credentials
router.post("/reset-password", userController.resetPassword);

// initiate password reset by sending a verification code to the user's email
router.post("/forgot-password", userController.forgotPassword);

// verify a submitted password reset code
router.post("/verify-reset-code", userController.verifyResetCode);

// log out a user
router.post("/logout", userController.logout);

// check if a token is still valid
router.get("/verify", userController.authenticate, (req, res) => {
  res.json({ success: true, message: "User token valid" });
});

// retrieve bookings for the logged-in user
router.get(
  "/bookings",
  userController.authenticate,
  bookingController.getUserBookings
);

// cancel a booking belonging to the logged-in user
router.delete(
  "/bookings/:id",
  userController.authenticate,
  bookingController.cancelUserBooking
);

// retrieve contact messages for the logged-in user
router.get(
  "/contacts",
  userController.authenticate,
  contactController.getUserContacts
);

// get user profile
router.get(
  "/profile",
  userController.authenticate,
  userController.getProfile
);

// update user profile (e.g., name)
router.put(
  "/profile",
  userController.authenticate,
  userController.updateProfile
);

module.exports = router;