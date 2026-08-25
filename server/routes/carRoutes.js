const express = require("express");
const router = express.Router();
const carController = require("../controllers/carController");

// Endpoint to fetch availability for a specific car by id.  This
// route must be declared before the generic /cars/:id route to
// avoid being captured by that handler.
router.get("/cars/:id/availability", carController.getCarAvailability);

// Endpoint to fetch a single car's details by id
router.get("/cars/:id", carController.getCarById);

// Return all cars (name, color, price, id, etc.)
router.get("/cars", carController.getCars);

module.exports = router;