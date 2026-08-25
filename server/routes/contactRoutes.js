const express = require("express");
const router = express.Router();
const contactController = require("../controllers/contactController");

// handle contact form submissions
router.post("/contact", express.json(), contactController.createContact);

module.exports = router;