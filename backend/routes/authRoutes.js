const express = require("express");
const { register, login, getMe, refresh, logout } = require("../controllers/authController");
const { authLimiter } = require("../middleware/rateLimitMiddleware");
const { protect } = require("../middleware/authMiddleware");

const router = express.Router();

router.post("/register", authLimiter, register);
router.post("/login", authLimiter, login);
router.post("/refresh", authLimiter, refresh);
router.post("/logout", logout);
router.get("/me", protect, getMe);

module.exports = router;
