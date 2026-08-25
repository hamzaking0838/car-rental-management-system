const express = require("express");
const router = express.Router();
const settingsController = require("../controllers/settingsController");
const adminController = require("../controllers/adminController");

// Public endpoint for non-sensitive settings
router.get("/settings", settingsController.getPublicSettings);

// Admin endpoints
router.get("/admin/settings", adminController.authenticate, settingsController.getAdminSettings);
router.put("/admin/settings", adminController.authenticate, express.json(), settingsController.updateSettings);

module.exports = router;
