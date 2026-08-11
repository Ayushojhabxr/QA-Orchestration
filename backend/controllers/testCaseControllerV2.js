const XLSX = require("xlsx");
const Project = require("../models/Project");
const TestCase = require("../models/TestCase");
const User = require("../models/User");
const { createActivityLog } = require("../services/activityService");
const { sendEmail } = require("../services/emailService");
const { createNotifications } = require("../services/notificationService");
const { ensureProjectAccess } = require("../services/projectAccessService");
const { emitToProject, emitToTestCase, emitToUsers } = require("../services/realtimeService");

const basePopulate = [
  { path: "assignedToDeveloperId", select: "name email role" },
  { path: "assignedTo", select: "name email role" },
  { path: "testerId", select: "name email role" },
  { path: "project", select: "name description members createdBy" },
  { path: "comments.userId", select: "name email role" },
  { path: "actionHistory.userId", select: "name email role" },
];

const transitionMap = {
  Pending: ["Assigned", "In Progress"],
  Assigned: ["In Progress"],
  "In Progress": ["Testing", "Fixed"],
  Testing: ["Fixed", "Closed"],
  Fixed: ["Closed"],
  Closed: [],
};

const FIELD_ALIASES = {
  scenarioId: [
    "scenario id",
    "scenarioid",
    "scenario_id",
    "bug id",
    "bugid",
    "bug_id",
    "defect id",
    "defectid",
    "ticket id",
    "ticketid",
    "case id",
    "caseid",
    "test case id",
    "tc id",
    "id",
  ],
  description: [
    "description",
    "summary",
    "issue",
    "bug title",
    "title",
    "process name",
    "process",
    "screen name",
    "module",
    "api",
    "feature",
    "scenario",
    "name",
  ],
  steps: [
    "steps",
    "step description",
    "repro steps",
    "reproduction steps",
    "actions",
    "action",
    "steps to reproduce",
    "procedure",
  ],
  expectedResult: [
    "expected result",
    "expected",
    "actual result",
    "comment",
    "comments",
    "test data",
    "notes",
    "remark",
    "remarks",
    "observation",
  ],
  priority: ["priority", "severity", "criticality"],
  status: ["status", "state", "bug status", "current status"],
  assignedDeveloper: [
    "assigned dev",
    "assigned developer",
    "assigned to",
    "developer",
    "owner",
    "assignee",
  ],
  testerName: ["written by", "tester", "qa", "assigned qa", "reporter", "created by"],
};

const KNOWN_HEADER_TOKENS = new Set(
  Object.values(FIELD_ALIASES)
    .flat()
    .map((value) => value.replace(/[^a-z0-9]+/gi, " ").trim().toLowerCase())
);

const normalizePriority = (priority = "") => {
  const value = String(priority).trim().toLowerCase();
  const map = {
    low: "Low",
    medium: "Medium",
    high: "High",
    critical: "Critical",
  };
  return map[value] || "Medium";
};

const normalizeStatus = (status = "") => {
  const value = String(status).trim().toLowerCase();
  const map = {
    pending: "Pending",
    assigned: "Assigned",
    "assigned to dev": "Assigned",
    "assigned to developer": "Assigned",
    "in progress": "In Progress",
    "in_progress": "In Progress",
    "under observation": "In Progress",
    "in testing": "Fixed",
    testing: "Testing",
    fixed: "Fixed",
    done: "Fixed",
    resolved: "Fixed",
    closed: "Closed",
  };
  return map[value] || "Pending";
};

const safeRegex = (value = "") =>
  new RegExp(String(value).replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "i");

const normalizeHeaderName = (value = "") =>
  String(value).toLowerCase().replace(/[^a-z0-9]+/g, " ").trim();

const rowValue = (row, keys) => {
  for (const key of keys) {
    if (row[key] !== undefined && row[key] !== null && row[key] !== "") {
      return row[key];
    }
  }
  return "";
};

const accessibleQuery = (user) => {
  if (user.role === "admin") {
    return {};
  }

  if (user.role === "developer") {
    return { assignedToDeveloperId: user._id };
  }

  return { testerId: user._id };
};

const normalizeRawData = (row = {}) =>
  Object.entries(row).reduce((accumulator, [key, value]) => {
    accumulator[key] = value === undefined || value === null ? "" : String(value);
    return accumulator;
  }, {});

const compactRow = (row = {}) =>
  Object.entries(row).reduce((accumulator, [key, value]) => {
    const normalizedKey = String(key || "").trim();
    const normalizedValue = value === undefined || value === null ? "" : String(value).trim();

    if (!normalizedKey || normalizedKey.startsWith("__EMPTY")) {
      return accumulator;
    }

    accumulator[normalizedKey] = normalizedValue;
    return accumulator;
  }, {});

const findHeaderKey = (row = {}, aliasGroup = []) => {
  const aliases = aliasGroup.map((alias) => normalizeHeaderName(alias));

  return Object.keys(row).find((key) => {
    const normalizedKey = normalizeHeaderName(key);
    return aliases.some(
      (alias) =>
        normalizedKey === alias ||
        normalizedKey.includes(alias) ||
        alias.includes(normalizedKey)
    );
  });
};

const getFieldValue = (row = {}, fieldName) => {
  const matchedKey = findHeaderKey(row, FIELD_ALIASES[fieldName] || []);
  return matchedKey ? row[matchedKey] : "";
};

const inferPriorityFromRow = (row = {}) => {
  const explicit = getFieldValue(row, "priority");
  if (explicit) {
    return normalizePriority(explicit);
  }

  const cellValue = Object.values(row).find((value) =>
    /^(low|medium|high|critical)$/i.test(String(value).trim())
  );
  return cellValue ? normalizePriority(cellValue) : "Medium";
};

const inferStatusFromRow = (row = {}) => {
  const explicit = getFieldValue(row, "status");
  if (explicit) {
    return normalizeStatus(explicit);
  }

  const cellValue = Object.values(row).find((value) =>
    /pending|assigned|progress|fixed|closed|done|resolved|testing|observation/i.test(
      String(value).trim()
    )
  );
  return cellValue ? normalizeStatus(cellValue) : "Pending";
};

const getMeaningfulValues = (row = {}, excludedKeys = []) => {
  const excluded = excludedKeys.map((key) => normalizeHeaderName(key));
  return Object.entries(row)
    .filter(([key, value]) => {
      const normalizedKey = normalizeHeaderName(key);
      const normalizedValue = String(value || "").trim();
      return (
        normalizedValue &&
        !excluded.includes(normalizedKey) &&
        !FIELD_ALIASES.priority.includes(normalizedKey) &&
        !FIELD_ALIASES.status.includes(normalizedKey)
      );
    })
    .map(([, value]) => String(value).trim());
};

const deriveScenarioId = (row = {}, sheetName, excelRowNumber) => {
  const directValue = getFieldValue(row, "scenarioId");
  if (directValue) {
    return String(directValue).trim();
  }

  const idHeader = Object.keys(row).find((key) => /(^| )(id|code|ticket|case|bug|defect)( |$)/i.test(key));
  if (idHeader && row[idHeader]) {
    return String(row[idHeader]).trim();
  }

  const firstMeaningful = getMeaningfulValues(row)[0];
  if (firstMeaningful && firstMeaningful.length <= 80) {
    return String(firstMeaningful).trim().replace(/\s+/g, "_").slice(0, 60);
  }

  const sheetToken = String(sheetName || "sheet")
    .replace(/[^a-z0-9]+/gi, "_")
    .replace(/^_+|_+$/g, "")
    .slice(0, 20);
  return `AUTO_${sheetToken || "sheet"}_${excelRowNumber}`;
};

const deriveDescription = (row = {}) => {
  const directValue = getFieldValue(row, "description");
  if (directValue) {
    return String(directValue).trim();
  }

  return getMeaningfulValues(row, FIELD_ALIASES.scenarioId)[0] || "";
};

const deriveSteps = (row = {}) => {
  const directValue = getFieldValue(row, "steps");
  if (directValue) {
    return String(directValue).trim();
  }

  return getMeaningfulValues(row, [...FIELD_ALIASES.scenarioId, ...FIELD_ALIASES.description])[0] || "";
};

const deriveExpectedResult = (row = {}) => {
  const directValue = getFieldValue(row, "expectedResult");
  if (directValue) {
    return String(directValue).trim();
  }

  return (
    getMeaningfulValues(row, [
      ...FIELD_ALIASES.scenarioId,
      ...FIELD_ALIASES.description,
      ...FIELD_ALIASES.steps,
    ])[0] || ""
  );
};

const applyKnownFields = (testCase, rawData) => {
  const scenarioId = getFieldValue(rawData, "scenarioId");
  const description = getFieldValue(rawData, "description");
  const steps = getFieldValue(rawData, "steps");
  const expectedResult = getFieldValue(rawData, "expectedResult");
  const priority = getFieldValue(rawData, "priority");

  if (scenarioId) testCase.scenarioId = scenarioId;
  if (description !== "") testCase.description = description;
  if (steps !== "") testCase.steps = steps;
  if (expectedResult !== "") testCase.expectedResult = expectedResult;
  if (priority) testCase.priority = normalizePriority(priority);
};

const pushAction = (testCase, payload) => {
  testCase.actionHistory.push({
    type: payload.type,
    userId: payload.userId,
    userName: payload.userName,
    message: payload.message,
    fromStatus: payload.fromStatus || "",
    toStatus: payload.toStatus || "",
    timestamp: payload.timestamp || new Date(),
  });
};

const findDeveloper = async (developerId) => {
  if (!developerId) {
    return null;
  }

  const developer = await User.findById(developerId).select("name email role");

  if (!developer || developer.role !== "developer") {
    throw new Error("Assigned user must be a developer");
  }

  return developer;
};

const getParticipantIds = (testCase, excludeUserId = null) =>
  [...new Set([testCase.testerId, testCase.assignedToDeveloperId].filter(Boolean).map(String))].filter(
    (userId) => userId !== String(excludeUserId || "")
  );

const broadcastTestCaseUpdate = (testCase, eventName, actorId) => {
  const participantIds = getParticipantIds(testCase, actorId);
  emitToUsers(participantIds, eventName, { testCase });
  emitToProject(testCase.project?._id || testCase.project, eventName, { testCase });
  emitToTestCase(testCase._id, eventName, { testCase });
};

const parseMentions = (message = "") => {
  const mentions = [];
  const normalizedMessage = String(message).replace(/@\[(.+?)\]\((.+?)\)/g, (_match, name, id) => {
    mentions.push({ name, id });
    return `@${name}`;
  });

  return { mentions, normalizedMessage };
};

const notifyAssignment = async (testCase, actor) => {
  if (!testCase.assignedToDeveloperId) {
    return;
  }

  await createNotifications({
    userIds: [testCase.assignedToDeveloperId],
    message: `Test case ${testCase.scenarioId} assigned to you`,
    type: "assignment",
    actor,
    targetType: "testcase",
    targetId: testCase._id,
    metadata: { status: testCase.status, projectId: testCase.project?._id || testCase.project || null },
  });

  const developer = await User.findById(testCase.assignedToDeveloperId).select("email name");
  await sendEmail({
    to: developer?.email,
    subject: `Assigned: ${testCase.scenarioId}`,
    text: `You have been assigned test case ${testCase.scenarioId} in project ${
      testCase.project?.name || "TestFlow"
    }.`,
  });
};

const suggestPriorityFromText = (text) => {
  const normalized = String(text || "").toLowerCase();

  if (/(critical|blocker|breach|security|production down|payment failed|data loss)/.test(normalized)) {
    return "Critical";
  }
  if (/(error|failure|unable|cannot|broken|timeout|exception|auth|login)/.test(normalized)) {
    return "High";
  }
  if (/(minor|ui|cosmetic|alignment|typo)/.test(normalized)) {
    return "Low";
  }
  return "Medium";
};

const scoreHeaderRow = (row = []) => {
  const normalized = row.map((cell) => normalizeHeaderName(cell)).filter(Boolean);
  if (normalized.length < 2) {
    return -1;
  }

  const aliasMatches = normalized.filter((cell) => KNOWN_HEADER_TOKENS.has(cell)).length;
  const idSignals = normalized.filter((cell) => /(id|bug|ticket|defect|case|scenario)/.test(cell)).length;
  const textSignals = normalized.filter((cell) => /[a-z]/.test(cell)).length;

  return aliasMatches * 12 + idSignals * 8 + textSignals * 2 + Math.min(normalized.length, 10);
};

const buildHeaders = (row = []) => {
  const seen = new Map();

  return row.map((cell, index) => {
    const baseHeader = String(cell || "").trim() || `Column ${index + 1}`;
    const count = seen.get(baseHeader) || 0;
    seen.set(baseHeader, count + 1);
    return count ? `${baseHeader} ${count + 1}` : baseHeader;
  });
};

const rowLooksMeaningful = (row = {}) => {
  const values = Object.values(row).map((value) => String(value || "").trim()).filter(Boolean);
  if (!values.length) {
    return false;
  }

  const longTextCount = values.filter((value) => value.length >= 6).length;
  return values.length >= 2 || longTextCount >= 1;
};

const detectHeaderRowIndex = (rows = []) => {
  let bestIndex = -1;
  let bestScore = -1;

  rows.slice(0, 30).forEach((row, index) => {
    const score = scoreHeaderRow(row);
    if (score > bestScore) {
      bestScore = score;
      bestIndex = index;
    }
  });

  if (bestIndex !== -1 && bestScore >= 8) {
    return bestIndex;
  }

  return rows.findIndex(
    (row) => row.filter((cell) => String(cell || "").trim() !== "").length >= 2
  );
};

const extractStructuredSheetRows = (worksheet) => {
  const rows = XLSX.utils.sheet_to_json(worksheet, { header: 1, defval: "" });
  const headerIndex = detectHeaderRowIndex(rows);

  if (headerIndex === -1) {
    return [];
  }

  const headers = buildHeaders(rows[headerIndex] || []);

  return rows
    .slice(headerIndex + 1)
    .map((row, index) => {
      const mapped = headers.reduce((accumulator, header, headerPosition) => {
        accumulator[header] = row[headerPosition] ?? "";
        return accumulator;
      }, {});

      return {
        row: compactRow(mapped),
        excelRowNumber: headerIndex + index + 2,
        headers: headers.filter(Boolean),
      };
    })
    .filter(({ row }) => rowLooksMeaningful(row));
};

const buildSearchClause = (queryText) => {
  if (!queryText) {
    return null;
  }

  const regex = safeRegex(queryText);
  return {
    $or: [
      { scenarioId: regex },
      { testerName: regex },
      { assignedToDeveloperName: regex },
      { sheetName: regex },
      { description: regex },
    ],
  };
};

const prepareDuplicateMaps = async (documents, projectId) => {
  const scenarioIds = [...new Set(documents.map((item) => item.scenarioId).filter(Boolean))];
  const descriptions = [...new Set(documents.map((item) => item.description).filter(Boolean))];

  if (!scenarioIds.length && !descriptions.length) {
    return { byScenario: new Map(), byDescription: new Map() };
  }

  const filter = {
    $or: [{ scenarioId: { $in: scenarioIds } }, { description: { $in: descriptions } }],
  };

  if (projectId) {
    filter.project = projectId;
  }

  const existing = await TestCase.find(filter).select("_id scenarioId description");
  const byScenario = new Map();
  const byDescription = new Map();

  existing.forEach((item) => {
    if (item.scenarioId) {
      byScenario.set(item.scenarioId, [...(byScenario.get(item.scenarioId) || []), item._id]);
    }
    if (item.description) {
      byDescription.set(item.description, [...(byDescription.get(item.description) || []), item._id]);
    }
  });

  return { byScenario, byDescription };
};

const attachAiSuggestions = (documents, duplicateMaps) =>
  documents.map((item) => {
    const duplicateCandidates = [
      ...(duplicateMaps.byScenario.get(item.scenarioId) || []),
      ...(duplicateMaps.byDescription.get(item.description) || []),
    ]
      .filter(Boolean)
      .slice(0, 5);

    return {
      ...item,
      aiSuggestions: {
        suggestedPriority: suggestPriorityFromText(
          `${item.description} ${item.steps} ${item.expectedResult}`
        ),
        duplicateCandidates,
        duplicateCount: duplicateCandidates.length,
      },
    };
  });

const notifyStatusChange = async (testCase, actor, previousStatus) => {
  if (previousStatus === testCase.status) {
    return;
  }

  const recipients = getParticipantIds(testCase, actor._id);
  await createNotifications({
    userIds: recipients,
    message: `Test case ${testCase.scenarioId} moved to ${testCase.status}`,
    type: "status",
    actor,
    targetType: "testcase",
    targetId: testCase._id,
    metadata: { fromStatus: previousStatus, toStatus: testCase.status },
  });

  const users = await User.find({ _id: { $in: recipients } }).select("email");
  await sendEmail({
    to: users.map((user) => user.email),
    subject: `Status changed: ${testCase.scenarioId}`,
    text: `Test case ${testCase.scenarioId} moved from ${previousStatus} to ${testCase.status}.`,
  });
};

const getTestCases = async (req, res) => {
  try {
    const query = { ...accessibleQuery(req.user) };
    const searchClause = buildSearchClause(req.query.q);

    if (req.query.priority) query.priority = req.query.priority;
    if (req.query.status) query.status = req.query.status;
    if (req.query.project) {
      const requiredRole = req.user.role === "tester" ? "tester" : null;
      await ensureProjectAccess(req.query.project, req.user, requiredRole);
      query.project = req.query.project;
      if (req.user.role === "tester") {
        delete query.testerId;
      }
    }
    if (req.query.sheetName) query.sheetName = req.query.sheetName;
    if (req.query.uploadBatchId) query.uploadBatchId = req.query.uploadBatchId;
    if (req.query.testerId) query.testerId = req.query.testerId;
    if (req.query.testerName) query.testerName = req.query.testerName;
    if (req.query.assignedTo && req.user.role !== "developer") query.assignedTo = req.query.assignedTo;
    if (req.query.assignedToDeveloperId && req.user.role !== "developer") {
      query.assignedToDeveloperId = req.query.assignedToDeveloperId;
    }

    const finalQuery = searchClause ? { $and: [query, searchClause] } : query;

    const [testCases, sheetNames, testerNames, projects] = await Promise.all([
      TestCase.find(finalQuery)
        .populate(basePopulate)
        .sort({ sheetName: 1, excelRowNumber: 1, updatedAt: -1, createdAt: -1 }),
      TestCase.distinct("sheetName", query),
      TestCase.distinct("testerName", query),
      Project.find().select("name description").sort({ name: 1 }),
    ]);

    return res.json({
      items: testCases,
      sheetNames: sheetNames.sort(),
      testerNames: testerNames.sort(),
      projects,
    });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

const getTestCaseById = async (req, res) => {
  try {
    const testCase = await TestCase.findById(req.params.id).populate(basePopulate);

    if (!testCase) {
      return res.status(404).json({ message: "Test case not found" });
    }

    if (req.user.role === "tester") {
      await ensureProjectAccess(testCase.project?._id || testCase.project, req.user, "tester");
    }

    if (
      req.user.role === "developer" &&
      String(testCase.assignedToDeveloperId?._id || testCase.assignedToDeveloperId || "") !==
        String(req.user._id)
    ) {
      return res.status(403).json({ message: "You can only view assigned test cases" });
    }

    return res.json(testCase);
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

const createTestCase = async (req, res) => {
  try {
    if (!req.body.project) {
      return res.status(400).json({ message: "Project is required for every test case" });
    }

    const project = await ensureProjectAccess(req.body.project, req.user, "tester");
    const rawData = normalizeRawData(
      req.body.rawData || {
        "Scenario ID": req.body.scenarioId || "",
        Description: req.body.description || "",
        Steps: req.body.steps || "",
        "Expected Result": req.body.expectedResult || "",
        Priority: req.body.priority || "Medium",
      }
    );
    const assignedDeveloper = await findDeveloper(
      req.body.assignedToDeveloperId || req.body.assignedTo || null
    ).catch((error) => {
      if (req.body.assignedToDeveloperId || req.body.assignedTo) throw error;
      return null;
    });

    const payload = {
      ...req.body,
      scenarioId: req.body.scenarioId || rowValue(rawData, ["Scenario ID"]),
      sheetName: req.body.sheetName || "Manual",
      priority: normalizePriority(req.body.priority || rawData.Priority),
      status: assignedDeveloper ? "Assigned" : normalizeStatus(req.body.status),
      testerId: req.user._id,
      testerName: req.user.name,
      assignedToDeveloperId: assignedDeveloper?._id || null,
      assignedToDeveloperName: assignedDeveloper?.name || "",
      assignedAt: assignedDeveloper ? new Date() : null,
      assignedTo: assignedDeveloper?._id || null,
      project: project?._id || null,
      source: "manual",
      uploadBatchId: req.body.uploadBatchId || "",
      headers: req.body.headers || Object.keys(rawData),
      rawData,
      comments: [],
      actionHistory: [],
      aiSuggestions: {
        suggestedPriority: suggestPriorityFromText(
          `${rawData.Description || ""} ${rawData.Steps || ""} ${rawData["Expected Result"] || ""}`
        ),
        duplicateCandidates: [],
        duplicateCount: 0,
      },
    };

    const testCase = new TestCase(payload);

    pushAction(testCase, {
      type: "created",
      userId: req.user._id,
      userName: req.user.name,
      message: `Created scenario ${payload.scenarioId} in sheet ${payload.sheetName}`,
    });

    if (assignedDeveloper) {
      pushAction(testCase, {
        type: "assigned",
        userId: req.user._id,
        userName: req.user.name,
        message: `Assigned to ${assignedDeveloper.name}`,
        toStatus: "Assigned",
      });
    }

    await testCase.save();
    const populated = await TestCase.findById(testCase._id).populate(basePopulate);

    await createActivityLog({
      action: "testcase.created",
      user: req.user,
      target: populated.scenarioId,
      targetType: "testcase",
      targetId: populated._id,
      projectId: populated.project?._id || populated.project || null,
      testCaseId: populated._id,
      metadata: { sheetName: populated.sheetName, priority: populated.priority },
    });

    if (assignedDeveloper) {
      await notifyAssignment(populated, req.user);
    }

    broadcastTestCaseUpdate(populated, "testcase:created", req.user._id);
    return res.status(201).json(populated);
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

const updateTestCase = async (req, res) => {
  try {
    const testCase = await TestCase.findById(req.params.id);

    if (!testCase) {
      return res.status(404).json({ message: "Test case not found" });
    }

    if (req.user.role === "developer" && String(testCase.assignedToDeveloperId) !== String(req.user._id)) {
      return res.status(403).json({ message: "You can only modify assigned test cases" });
    }

    if (req.user.role === "developer" && (req.body.assignedToDeveloperId !== undefined || req.body.assignedTo !== undefined)) {
      return res.status(403).json({ message: "Developers cannot change assignment" });
    }

    if (req.body.project !== undefined) {
      const requiredRole = req.user.role === "tester" ? "tester" : null;
      const project = await ensureProjectAccess(req.body.project || null, req.user, requiredRole);
      testCase.project = project?._id || null;
    }

    ["description", "steps", "expectedResult", "scenarioId", "sheetName"].forEach((field) => {
      if (req.body[field] !== undefined) {
        testCase[field] = req.body[field];
      }
    });

    const previousStatus = testCase.status;
    const previousAssigneeId = String(testCase.assignedToDeveloperId || "");
    const developerUpdate = req.user.role === "developer" && req.body.status && req.body.status !== testCase.status;

    if (req.body.priority) {
      testCase.priority = normalizePriority(req.body.priority);
    }

    if (req.body.status) {
      const nextStatus = normalizeStatus(req.body.status);

      if (developerUpdate) {
        const allowedTransitions = transitionMap[testCase.status] || [];
        if (!allowedTransitions.includes(nextStatus)) {
          return res.status(400).json({
            message: `Invalid workflow transition from ${testCase.status} to ${nextStatus}`,
          });
        }
      }

      testCase.status = nextStatus;
    }

    if (req.body.rawData) {
      testCase.rawData = normalizeRawData(req.body.rawData);
      testCase.headers = req.body.headers || Object.keys(testCase.rawData);
      applyKnownFields(testCase, testCase.rawData);
      testCase.aiSuggestions = {
        ...(testCase.aiSuggestions || {}),
        suggestedPriority: suggestPriorityFromText(
          `${testCase.description} ${testCase.steps} ${testCase.expectedResult}`
        ),
      };
    }

    if (req.body.assignedToDeveloperId !== undefined || req.body.assignedTo !== undefined) {
      const assignedDeveloper = await findDeveloper(
        req.body.assignedToDeveloperId || req.body.assignedTo || null
      ).catch((error) => {
        if (req.body.assignedToDeveloperId || req.body.assignedTo) throw error;
        return null;
      });

      testCase.assignedToDeveloperId = assignedDeveloper?._id || null;
      testCase.assignedToDeveloperName = assignedDeveloper?.name || "";
      testCase.assignedTo = assignedDeveloper?._id || null;
      testCase.assignedAt = assignedDeveloper ? new Date() : null;

      pushAction(testCase, {
        type: "assigned",
        userId: req.user._id,
        userName: req.user.name,
        message: assignedDeveloper ? `Assigned to ${assignedDeveloper.name}` : "Assignment cleared",
      });

      if (assignedDeveloper && previousStatus === "Pending") {
        testCase.status = "Assigned";
      }
    }

    if (previousStatus !== testCase.status) {
      pushAction(testCase, {
        type: "status_changed",
        userId: req.user._id,
        userName: req.user.name,
        message: `Moved status from ${previousStatus} to ${testCase.status}`,
        fromStatus: previousStatus,
        toStatus: testCase.status,
      });
    } else if (req.body.rawData || req.body.priority || req.body.project || req.body.description) {
      pushAction(testCase, {
        type: "updated",
        userId: req.user._id,
        userName: req.user.name,
        message: "Updated test case details",
      });
    }

    await testCase.save();

    const populated = await TestCase.findById(testCase._id).populate(basePopulate);

    await createActivityLog({
      action: previousStatus !== populated.status ? "testcase.status_changed" : "testcase.updated",
      user: req.user,
      target: populated.scenarioId,
      targetType: "testcase",
      targetId: populated._id,
      projectId: populated.project?._id || populated.project || null,
      testCaseId: populated._id,
      metadata: {
        fromStatus: previousStatus,
        toStatus: populated.status,
        assignedToDeveloperName: populated.assignedToDeveloperName,
      },
    });

    if (previousAssigneeId !== String(populated.assignedToDeveloperId || "")) {
      await notifyAssignment(populated, req.user);
      broadcastTestCaseUpdate(populated, "testcase:assigned", req.user._id);
    }

    await notifyStatusChange(populated, req.user, previousStatus);
    broadcastTestCaseUpdate(
      populated,
      previousStatus !== populated.status ? "testcase:status_changed" : "testcase:updated",
      req.user._id
    );

    return res.json(populated);
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

const assignTestCase = async (req, res) => {
  try {
    const { assignedToDeveloperId, assignedTo } = req.body;
    const testCase = await TestCase.findById(req.params.id);

    if (!testCase) {
      return res.status(404).json({ message: "Test case not found" });
    }

    const developer = await findDeveloper(assignedToDeveloperId || assignedTo || null).catch((error) => {
      if (assignedToDeveloperId || assignedTo) throw error;
      return null;
    });

    const previousStatus = testCase.status;

    testCase.assignedToDeveloperId = developer?._id || null;
    testCase.assignedToDeveloperName = developer?.name || "";
    testCase.assignedTo = developer?._id || null;
    testCase.assignedAt = developer ? new Date() : null;

    if (developer && testCase.status === "Pending") {
      testCase.status = "Assigned";
    }

    pushAction(testCase, {
      type: "assigned",
      userId: req.user._id,
      userName: req.user.name,
      message: developer ? `Assigned to ${developer.name}` : "Assignment cleared",
      toStatus: developer ? testCase.status : "",
    });

    await testCase.save();

    const populated = await TestCase.findById(testCase._id).populate(basePopulate);

    await createActivityLog({
      action: "testcase.assigned",
      user: req.user,
      target: populated.scenarioId,
      targetType: "testcase",
      targetId: populated._id,
      projectId: populated.project?._id || populated.project || null,
      testCaseId: populated._id,
      metadata: {
        assignedToDeveloperName: populated.assignedToDeveloperName,
        status: populated.status,
      },
    });

    if (developer) {
      await notifyAssignment(populated, req.user);
    }

    await notifyStatusChange(populated, req.user, previousStatus);
    broadcastTestCaseUpdate(populated, "testcase:assigned", req.user._id);

    return res.json(populated);
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

const addComment = async (req, res) => {
  try {
    const { text, mentions: mentionIds = [] } = req.body;

    if (!text) {
      return res.status(400).json({ message: "Comment text is required" });
    }

    const testCase = await TestCase.findById(req.params.id);

    if (!testCase) {
      return res.status(404).json({ message: "Test case not found" });
    }

    const parsedMentions = parseMentions(text);
    const mentions =
      mentionIds.length > 0
        ? mentionIds.map((id) => ({ id }))
        : parsedMentions.mentions;
    const normalizedMessage = mentionIds.length > 0 ? String(text) : parsedMentions.normalizedMessage;

    testCase.comments.push({
      userId: req.user._id,
      userName: req.user.name,
      comment: normalizedMessage,
      mentions: mentions.map((mention) => mention.id).filter(Boolean),
      timestamp: new Date(),
    });

    pushAction(testCase, {
      type: "comment_added",
      userId: req.user._id,
      userName: req.user.name,
      message: `Added comment: ${normalizedMessage.slice(0, 80)}`,
    });

    await testCase.save();

    const populated = await TestCase.findById(testCase._id).populate(basePopulate);
    const recipients = getParticipantIds(populated, req.user._id);

    await createActivityLog({
      action: "testcase.comment_added",
      user: req.user,
      target: populated.scenarioId,
      targetType: "testcase",
      targetId: populated._id,
      projectId: populated.project?._id || populated.project || null,
      testCaseId: populated._id,
      metadata: { commentPreview: normalizedMessage.slice(0, 120), mentions },
    });

    await createNotifications({
      userIds: recipients,
      message: `${req.user.name} commented on ${populated.scenarioId}`,
      type: "comment",
      actor: req.user,
      targetType: "testcase",
      targetId: populated._id,
      metadata: { commentPreview: normalizedMessage.slice(0, 120), mentions },
    });

    if (mentions.length) {
      const mentionedUsers = await User.find({ _id: { $in: mentions.map((mention) => mention.id) } }).select(
        "email _id"
      );

      await createNotifications({
        userIds: mentionedUsers.map((user) => user._id),
        message: `${req.user.name} mentioned you on ${populated.scenarioId}`,
        type: "mention",
        actor: req.user,
        targetType: "testcase",
        targetId: populated._id,
        metadata: { commentPreview: normalizedMessage.slice(0, 120) },
      });

      await sendEmail({
        to: mentionedUsers.map((user) => user.email),
        subject: `Mentioned in ${populated.scenarioId}`,
        text: `${req.user.name} mentioned you in a comment on ${populated.scenarioId}.\n\n${normalizedMessage}`,
      });
    }

    broadcastTestCaseUpdate(populated, "testcase:comment_added", req.user._id);
    return res.json(populated);
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

const uploadExcel = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: "Excel file is required" });
    }

    if (!req.body.project) {
      return res.status(400).json({ message: "Project is required for Excel uploads" });
    }

    const project = await ensureProjectAccess(req.body.project, req.user, "tester");
    const workbook = XLSX.read(req.file.buffer, { type: "buffer" });
    const uploadBatchId = `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
    const assignedDeveloper = await findDeveloper(
      req.body.assignedToDeveloperId || req.body.assignedTo || null
    ).catch((error) => {
      if (req.body.assignedToDeveloperId || req.body.assignedTo) throw error;
      return null;
    });
    const documents = [];

    workbook.SheetNames.forEach((sheetName) => {
      const worksheet = workbook.Sheets[sheetName];
      const rows = extractStructuredSheetRows(worksheet);

      rows.forEach(({ row, excelRowNumber, headers }) => {
        const rawData = normalizeRawData(row);
        const scenarioId = deriveScenarioId(rawData, sheetName, excelRowNumber);

        documents.push({
          testerId: req.user._id,
          testerName: req.user.name,
          sheetName,
          scenarioId,
          description: deriveDescription(rawData),
          steps: deriveSteps(rawData),
          expectedResult: deriveExpectedResult(rawData),
          priority: inferPriorityFromRow(rawData),
          status: assignedDeveloper ? "Assigned" : inferStatusFromRow(rawData),
          assignedToDeveloperId: assignedDeveloper?._id || null,
          assignedToDeveloperName: assignedDeveloper?.name || "",
          assignedAt: assignedDeveloper ? new Date() : null,
          assignedTo: assignedDeveloper?._id || null,
          project: project?._id || null,
          source: "excel",
          sourceFileName: req.file.originalname,
          uploadBatchId,
          headers,
          rawData,
          excelRowNumber,
          comments: [],
          actionHistory: [
            {
              type: "created",
              userId: req.user._id,
              userName: req.user.name,
              message: `Imported from ${sheetName} row ${excelRowNumber}`,
              timestamp: new Date(),
            },
            ...(assignedDeveloper
              ? [
                  {
                    type: "assigned",
                    userId: req.user._id,
                    userName: req.user.name,
                    message: `Assigned to ${assignedDeveloper.name}`,
                    toStatus: "Assigned",
                    timestamp: new Date(),
                  },
                ]
              : []),
          ],
        });
      });
    });

    if (!documents.length) {
      return res.status(400).json({ message: "No valid test cases found in the sheet" });
    }

    const duplicateMaps = await prepareDuplicateMaps(documents, project?._id || null);
    const enhancedDocuments = attachAiSuggestions(documents, duplicateMaps);

    const chunkSize = 500;
    for (let start = 0; start < enhancedDocuments.length; start += chunkSize) {
      await TestCase.insertMany(enhancedDocuments.slice(start, start + chunkSize), { ordered: false });
    }

    const testCases = await TestCase.find({
      testerId: req.user._id,
      uploadBatchId,
    })
      .populate(basePopulate)
      .sort({ sheetName: 1, excelRowNumber: 1 });

    await createActivityLog({
      action: "testcase.bulk_import",
      user: req.user,
      target: req.file.originalname,
      targetType: "testcase",
      projectId: project?._id || null,
      metadata: {
        uploadBatchId,
        count: enhancedDocuments.length,
        sheetNames: [...new Set(enhancedDocuments.map((item) => item.sheetName))],
      },
    });

    if (assignedDeveloper) {
      await createNotifications({
        userIds: [assignedDeveloper._id],
        message: `${enhancedDocuments.length} test cases assigned to you from ${req.file.originalname}`,
        type: "assignment",
        actor: req.user,
        targetType: "testcase",
        metadata: { uploadBatchId, count: enhancedDocuments.length },
      });
      await sendEmail({
        to: assignedDeveloper.email,
        subject: `Assigned test cases from ${req.file.originalname}`,
        text: `${enhancedDocuments.length} test cases were assigned to you from project ${
          project?.name || "TestFlow"
        }.`,
      });
    }

    return res.status(201).json({
      message: `${enhancedDocuments.length} test cases uploaded`,
      uploadBatchId,
      sheetNames: [...new Set(enhancedDocuments.map((item) => item.sheetName))],
      aiSuggestions: enhancedDocuments.map((item) => ({
        scenarioId: item.scenarioId,
        sheetName: item.sheetName,
        ...item.aiSuggestions,
      })),
      testCases,
    });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

const exportExcel = async (req, res) => {
  try {
    const query = { ...accessibleQuery(req.user) };

    if (req.query.project) query.project = req.query.project;
    if (req.query.sheetName) query.sheetName = req.query.sheetName;
    if (req.query.uploadBatchId) query.uploadBatchId = req.query.uploadBatchId;

    const testCases = await TestCase.find(query)
      .populate(basePopulate)
      .sort({ sheetName: 1, excelRowNumber: 1, createdAt: -1 });

    if (!testCases.length) {
      return res.status(404).json({ message: "No test cases found for export" });
    }

    const workbook = XLSX.utils.book_new();
    const groups = testCases.reduce((accumulator, item) => {
      const key = item.sheetName || "Sheet1";
      accumulator[key] = accumulator[key] || [];
      accumulator[key].push(item);
      return accumulator;
    }, {});

    Object.entries(groups).forEach(([sheetName, items]) => {
      const preferredHeaders = items[0]?.headers?.length
        ? items[0].headers
        : ["Scenario ID", "Description", "Steps", "Expected Result", "Priority"];
      const headers = [...preferredHeaders];

      if (!headers.includes("Assigned To")) headers.push("Assigned To");
      if (!headers.includes("Status")) headers.push("Status");
      if (!headers.includes("Project")) headers.push("Project");

      const rows = items.map((item) => {
        const row = {};
        headers.forEach((header) => {
          if (header === "Assigned To") row[header] = item.assignedToDeveloperName || item.assignedToDeveloperId?.name || "";
          else if (header === "Status") row[header] = item.status;
          else if (header === "Project") row[header] = item.project?.name || "";
          else row[header] = item.rawData?.[header] ?? "";
        });
        return row;
      });

      const worksheet = XLSX.utils.json_to_sheet(rows, { header: headers });
      XLSX.utils.book_append_sheet(workbook, worksheet, sheetName.slice(0, 31));
    });

    const buffer = XLSX.write(workbook, { type: "buffer", bookType: "xlsx" });
    res.setHeader("Content-Type", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet");
    res.setHeader("Content-Disposition", 'attachment; filename="testflow-testcases.xlsx"');
    return res.send(buffer);
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

module.exports = {
  accessibleQuery,
  basePopulate,
  getTestCases,
  getTestCaseById,
  createTestCase,
  updateTestCase,
  assignTestCase,
  addComment,
  uploadExcel,
  exportExcel,
};
