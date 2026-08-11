const Project = require("../models/Project");
const { createActivityLog } = require("../services/activityService");
const { createNotifications } = require("../services/notificationService");
const { getAccessibleProjectQuery } = require("../services/projectAccessService");

const populateProject = (query) =>
  query
    .populate("createdBy", "name email role")
    .populate("testers", "name email role")
    .populate("developers", "name email role");

const getProjects = async (req, res) => {
  try {
    const projects = await populateProject(Project.find(getAccessibleProjectQuery(req.user))).sort({
      createdAt: -1,
    });

    return res.json(projects);
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

const getProjectById = async (req, res) => {
  try {
    const project = await populateProject(Project.findById(req.params.id));

    if (!project) {
      return res.status(404).json({ message: "Project not found" });
    }

    if (req.user.role !== "admin") {
      const testers = (project.testers || []).map((item) => String(item._id || item));
      const developers = (project.developers || []).map((item) => String(item._id || item));
      const allowed =
        testers.includes(String(req.user._id)) || developers.includes(String(req.user._id));

      if (!allowed) {
        return res.status(403).json({ message: "You do not have access to this project" });
      }
    }

    return res.json(project);
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

const createProject = async (req, res) => {
  try {
    const { name, description, testers = [], developers = [] } = req.body;

    if (!name) {
      return res.status(400).json({ message: "Project name is required" });
    }

    const project = await Project.create({
      name,
      description,
      testers: [...new Set((testers || []).map(String))],
      developers: [...new Set((developers || []).map(String))],
      createdBy: req.user._id,
    });

    const populatedProject = await populateProject(Project.findById(project._id));

    await createActivityLog({
      action: "project.created",
      user: req.user,
      target: populatedProject.name,
      targetType: "project",
      targetId: populatedProject._id,
      projectId: populatedProject._id,
      metadata: {
        testerCount: populatedProject.testers.length,
        developerCount: populatedProject.developers.length,
      },
    });

    await createNotifications({
      userIds: [...populatedProject.testers, ...populatedProject.developers].map((member) => member._id),
      message: `You were added to project ${populatedProject.name}`,
      type: "project",
      actor: req.user,
      targetType: "project",
      targetId: populatedProject._id,
    });

    return res.status(201).json(populatedProject);
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

const updateProject = async (req, res) => {
  try {
    const { name, description, testers, developers } = req.body;
    const project = await Project.findById(req.params.id);

    if (!project) {
      return res.status(404).json({ message: "Project not found" });
    }

    project.name = name ?? project.name;
    project.description = description ?? project.description;
    if (Array.isArray(testers)) {
      project.testers = [...new Set(testers.map(String))];
    }
    if (Array.isArray(developers)) {
      project.developers = [...new Set(developers.map(String))];
    }

    await project.save();

    const populatedProject = await populateProject(Project.findById(project._id));

    await createActivityLog({
      action: "project.updated",
      user: req.user,
      target: populatedProject.name,
      targetType: "project",
      targetId: populatedProject._id,
      projectId: populatedProject._id,
      metadata: {
        testerCount: populatedProject.testers.length,
        developerCount: populatedProject.developers.length,
      },
    });

    return res.json(populatedProject);
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

const deleteProject = async (req, res) => {
  try {
    const project = await Project.findById(req.params.id);

    if (!project) {
      return res.status(404).json({ message: "Project not found" });
    }

    await createActivityLog({
      action: "project.deleted",
      user: req.user,
      target: project.name,
      targetType: "project",
      targetId: project._id,
      projectId: project._id,
    });

    await project.deleteOne();
    return res.json({ message: "Project deleted" });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

module.exports = { getProjects, getProjectById, createProject, updateProject, deleteProject };
