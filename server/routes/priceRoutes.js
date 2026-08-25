const express = require("express");
const router = express.Router();
const priceController = require("../controllers/priceController");

// Get price for a specific car by name
router.get("/car-price/:name", priceController.getCarPrice);

// Update price for a specific car (admin use only)
router.post("/update-car-price", priceController.updateCarPrice);

module.exports = router;