const Project = require("../models/Project");

const isAssignedTester = (project, userId) =>
  (project.testers || []).some((tester) => String(tester) === String(userId));

const isAssignedDeveloper = (project, userId) =>
  (project.developers || []).some((developer) => String(developer) === String(userId));

const getAccessibleProjectQuery = (user) => {
  if (user.role === "admin") {
    return {};
  }

  if (user.role === "tester") {
    return { testers: user._id };
  }

  return { developers: user._id };
};

const ensureProjectAccess = async (projectId, user, requiredRole = null) => {
  if (!projectId) {
    return null;
  }

  const project = await Project.findById(projectId).select("name createdBy testers developers");

  if (!project) {
    throw new Error("Project not found");
  }

  if (user.role === "admin") {
    return project;
  }

  if (requiredRole === "tester" && !isAssignedTester(project, user._id)) {
    throw new Error("You are not assigned as tester on this project");
  }

  if (requiredRole === "developer" && !isAssignedDeveloper(project, user._id)) {
    throw new Error("You are not assigned as developer on this project");
  }

  if (!requiredRole) {
    const allowed =
      isAssignedTester(project, user._id) ||
      isAssignedDeveloper(project, user._id) ||
      String(project.createdBy) === String(user._id);

    if (!allowed) {
      throw new Error("You do not have access to this project");
    }
  }

  return project;
};

module.exports = {
  ensureProjectAccess,
  getAccessibleProjectQuery,
  isAssignedDeveloper,
  isAssignedTester,
};
