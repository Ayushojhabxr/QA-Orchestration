const express = require("express");
const {
  searchGlobal,
  getSystemAnalytics,
  getActivityFeed,
} = require("../controllers/systemController");
const { protect, authorize } = require("../middleware/authMiddleware");

const router = express.Router();

router.get("/search", protect, searchGlobal);
router.get("/analytics", protect, authorize("admin"), getSystemAnalytics);
router.get("/activity", protect, authorize("admin"), getActivityFeed);

module.exports = router;
