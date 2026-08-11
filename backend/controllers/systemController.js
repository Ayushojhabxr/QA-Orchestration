const ActivityLog = require("../models/ActivityLog");
const Notification = require("../models/Notification");
const Project = require("../models/Project");
const TestCase = require("../models/TestCase");
const User = require("../models/User");
const { accessibleQuery, basePopulate } = require("./testCaseControllerV2");

const safeRegex = (value = "") =>
  new RegExp(String(value).replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "i");

const searchGlobal = async (req, res) => {
  try {
    const q = String(req.query.q || "").trim();

    if (!q) {
      return res.json({ items: [] });
    }

    const query = {
      $and: [
        accessibleQuery(req.user),
        {
          $or: [
            { scenarioId: safeRegex(q) },
            { testerName: safeRegex(q) },
            { assignedToDeveloperName: safeRegex(q) },
            { sheetName: safeRegex(q) },
            { description: safeRegex(q) },
          ],
        },
      ],
    };

    const items = await TestCase.find(query)
      .populate(basePopulate)
      .sort({ updatedAt: -1 })
      .limit(25);

    return res.json({ items });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

const getSystemAnalytics = async (req, res) => {
  try {
    const [userCount, projectCount, testCaseCount, notificationsUnread, recentActivity, testCases, users] =
      await Promise.all([
        User.countDocuments(),
        Project.countDocuments(),
        TestCase.countDocuments(),
        Notification.countDocuments({ read: false }),
        ActivityLog.find().sort({ timestamp: -1 }).limit(20),
        TestCase.find().select("status priority assignedToDeveloperName project"),
        User.find().select("name role"),
      ]);

    const developerLoad = users
      .filter((user) => user.role === "developer")
      .map((developer) => ({
        name: developer.name,
        assigned: testCases.filter((item) => item.assignedToDeveloperName === developer.name).length,
      }));

    const statusBreakdown = ["Pending", "Assigned", "In Progress", "Fixed", "Closed"].map((status) => ({
      name: status,
      value: testCases.filter((item) => item.status === status).length,
    }));

    const priorityBreakdown = ["Low", "Medium", "High", "Critical"].map((priority) => ({
      name: priority,
      value: testCases.filter((item) => item.priority === priority).length,
    }));

    const projects = await Project.find().select("name").sort({ name: 1 });
    const projectHealth = projects.map((project) => ({
      name: project.name,
      total: testCases.filter((item) => String(item.project || "") === String(project._id)).length,
    }));

    return res.json({
      counts: {
        users: userCount,
        projects: projectCount,
        testCases: testCaseCount,
        unreadNotifications: notificationsUnread,
      },
      developerLoad,
      statusBreakdown,
      priorityBreakdown,
      projectHealth,
      recentActivity,
    });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

const getActivityFeed = async (req, res) => {
  try {
    const limit = Math.min(Number(req.query.limit) || 40, 100);
    const items = await ActivityLog.find().sort({ timestamp: -1 }).limit(limit);
    return res.json({ items });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

module.exports = { searchGlobal, getSystemAnalytics, getActivityFeed };
