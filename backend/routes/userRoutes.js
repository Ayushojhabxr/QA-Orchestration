const express = require("express");
const {
  getUsers,
  getDevelopers,
  getCompanyUsers,
  updateUserRole,
} = require("../controllers/userController");
const { protect, authorize } = require("../middleware/authMiddleware");

const router = express.Router();

router.get("/", protect, authorize("admin"), getUsers);
router.get("/company", protect, getCompanyUsers);
router.get("/developers", protect, authorize("admin", "tester"), getDevelopers);
router.patch("/:id/role", protect, authorize("admin"), updateUserRole);

module.exports = router;
