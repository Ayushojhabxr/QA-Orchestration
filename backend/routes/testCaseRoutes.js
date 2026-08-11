const express = require("express");
const multer = require("multer");
const {
  getTestCases,
  getTestCaseById,
  createTestCase,
  updateTestCase,
  assignTestCase,
  addComment,
  uploadExcel,
  exportExcel,
} = require("../controllers/testCaseControllerV2");
const { protect, authorize } = require("../middleware/authMiddleware");

const router = express.Router();
const upload = multer({ storage: multer.memoryStorage() });

router.get("/", protect, getTestCases);
router.get("/:id", protect, getTestCaseById);
router.post("/", protect, authorize("tester", "admin"), createTestCase);
router.post("/upload", protect, authorize("tester", "admin"), upload.single("file"), uploadExcel);
router.get("/export", protect, authorize("tester", "admin"), exportExcel);
router.patch("/:id", protect, updateTestCase);
router.patch("/:id/assign", protect, authorize("tester", "admin"), assignTestCase);
router.post("/:id/comments", protect, authorize("admin", "developer", "tester"), addComment);

module.exports = router;
