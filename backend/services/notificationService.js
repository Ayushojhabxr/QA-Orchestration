const Notification = require("../models/Notification");
const { emitToUsers } = require("./realtimeService");

const createNotifications = async ({
  userIds = [],
  message,
  type = "system",
  actor = null,
  targetType = "system",
  targetId = null,
  metadata = {},
}) => {
  const uniqueUserIds = [...new Set(userIds.filter(Boolean).map(String))];

  if (!uniqueUserIds.length || !message) {
    return [];
  }

  const notifications = await Notification.insertMany(
    uniqueUserIds.map((userId) => ({
      userId,
      message,
      type,
      actorId: actor?._id || null,
      actorName: actor?.name || "",
      targetType,
      targetId,
      metadata,
    }))
  );

  emitToUsers(
    uniqueUserIds,
    "notifications:new",
    notifications.map((notification) => notification.toObject())
  );

  return notifications;
};

module.exports = { createNotifications };
