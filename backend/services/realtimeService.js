let ioInstance = null;

const initializeRealtime = (io) => {
  ioInstance = io;
};

const getRealtime = () => ioInstance;

const emitToUser = (userId, event, payload) => {
  if (!ioInstance || !userId) return;
  ioInstance.to(`user:${userId}`).emit(event, payload);
};

const emitToUsers = (userIds, event, payload) => {
  [...new Set((userIds || []).filter(Boolean).map(String))].forEach((userId) => {
    emitToUser(userId, event, payload);
  });
};

const emitToProject = (projectId, event, payload) => {
  if (!ioInstance || !projectId) return;
  ioInstance.to(`project:${projectId}`).emit(event, payload);
};

const emitToTestCase = (testCaseId, event, payload) => {
  if (!ioInstance || !testCaseId) return;
  ioInstance.to(`testcase:${testCaseId}`).emit(event, payload);
};

module.exports = {
  emitToProject,
  emitToTestCase,
  emitToUser,
  emitToUsers,
  getRealtime,
  initializeRealtime,
};
