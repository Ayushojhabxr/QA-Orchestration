const User = require("../models/User");
const { createActivityLog } = require("../services/activityService");

const getUsers = async (_req, res) => {
  try {
    const users = await User.find().select("-password").sort({ createdAt: -1 });
    return res.json(users);
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

const getDevelopers = async (_req, res) => {
  try {
    const developers = await User.find({ role: "developer" })
      .select("name email role createdAt")
      .sort({ name: 1 });

    return res.json(developers);
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

const getCompanyUsers = async (_req, res) => {
  try {
    const users = await User.find()
      .select("name email role createdAt")
      .sort({ name: 1 });

    return res.json(users);
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

const updateUserRole = async (req, res) => {
  try {
    const { role } = req.body;
    const user = await User.findById(req.params.id);
    const previousRole = user?.role;

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    user.role = role || user.role;
    await user.save();

    await createActivityLog({
      action: "user.role_updated",
      user: req.user,
      target: user.email,
      targetType: "user",
      targetId: user._id,
      metadata: { fromRole: previousRole, toRole: user.role },
    });

    return res.json({
      message: "User role updated",
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        createdAt: user.createdAt,
      },
    });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

module.exports = { getUsers, getDevelopers, getCompanyUsers, updateUserRole };
