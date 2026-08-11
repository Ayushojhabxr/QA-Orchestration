const ActivityLog = require("../models/ActivityLog");

const createActivityLog = async ({
  action,
  user,
  target,
  targetType,
  targetId = null,
  projectId = null,
  testCaseId = null,
  metadata = {},
  oldValue = null,
  newValue = null,
}) => {
  if (!user?._id || !action || !target || !targetType) {
    return null;
  }

  return ActivityLog.create({
    action,
    userId: user._id,
    userName: user.name,
    target,
    targetType,
    targetId,
    projectId,
    testCaseId,
    metadata,
    oldValue,
    newValue,
    timestamp: new Date(),
  });
};

module.exports = { createActivityLog };
