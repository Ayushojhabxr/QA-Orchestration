const XLSX = require("xlsx");
const TestCase = require("../models/TestCase");
const User = require("../models/User");

const basePopulate = [
  { path: "assignedToDeveloperId", select: "name email role" },
  { path: "assignedTo", select: "name email role" },
  { path: "testerId", select: "name email role" },
  { path: "project", select: "name description" },
  { path: "comments.userId", select: "name email role" },
  { path: "actionHistory.userId", select: "name email role" },
];

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
    "in progress": "In Progress",
    "in_progress": "In Progress",
    fixed: "Fixed",
    closed: "Closed",
  };
  return map[value] || "Pending";
};

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

const normalizeRawData = (row) =>
  Object.entries(row).reduce((accumulator, [key, value]) => {
    accumulator[key] = value === undefined || value === null ? "" : String(value);
    return accumulator;
  }, {});

const applyKnownFields = (testCase, rawData) => {
  const scenarioId = rowValue(rawData, ["Scenario ID", "ScenarioId", "scenarioId", "scenario_id"]);
  const description = rowValue(rawData, ["Description", "description"]);
  const steps = rowValue(rawData, ["Steps", "steps"]);
  const expectedResult = rowValue(rawData, ["Expected Result", "expectedResult", "Expected"]);
  const priority = rowValue(rawData, ["Priority", "priority"]);

  if (scenarioId) {
    testCase.scenarioId = scenarioId;
  }
  if (description !== "") {
    testCase.description = description;
  }
  if (steps !== "") {
    testCase.steps = steps;
  }
  if (expectedResult !== "") {
    testCase.expectedResult = expectedResult;
  }
  if (priority) {
    testCase.priority = normalizePriority(priority);
  }
};

const transitionMap = {
  Pending: ["Assigned", "In Progress"],
  Assigned: ["In Progress"],
  "In Progress": ["Fixed"],
  Fixed: ["Closed"],
  Closed: [],
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

const getTestCases = async (req, res) => {
  try {
    const query = { ...accessibleQuery(req.user) };

    if (req.query.priority) {
      query.priority = req.query.priority;
    }

    if (req.query.status) {
      query.status = req.query.status;
    }

    if (req.query.project) {
      query.project = req.query.project;
    }

    if (req.query.sheetName) {
      query.sheetName = req.query.sheetName;
    }

    if (req.query.uploadBatchId) {
      query.uploadBatchId = req.query.uploadBatchId;
    }

    if (req.query.testerId) {
      query.testerId = req.query.testerId;
    }

    if (req.query.testerName) {
      query.testerName = req.query.testerName;
    }

    if (req.query.assignedTo && req.user.role !== "developer") {
      query.assignedTo = req.query.assignedTo;
    }

    if (req.query.assignedToDeveloperId && req.user.role !== "developer") {
      query.assignedToDeveloperId = req.query.assignedToDeveloperId;
    }

    const [testCases, sheetNames, testerNames] = await Promise.all([
      TestCase.find(query)
        .populate(basePopulate)
        .sort({ sheetName: 1, excelRowNumber: 1, updatedAt: -1, createdAt: -1 }),
      TestCase.distinct("sheetName", query),
      TestCase.distinct("testerName", query),
    ]);

    return res.json({
      items: testCases,
      sheetNames: sheetNames.sort(),
      testerNames: testerNames.sort(),
    });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

const createTestCase = async (req, res) => {
  try {
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
      if (req.body.assignedToDeveloperId || req.body.assignedTo) {
        throw error;
      }

      return null;
    });

    const payload = {
      ...req.body,
      scenarioId: req.body.scenarioId || rowValue(rawData, ["Scenario ID"]),
      sheetName: req.body.sheetName || "Manual",
      priority: normalizePriority(req.body.priority),
      status: assignedDeveloper ? "Assigned" : normalizeStatus(req.body.status),
      testerId: req.user._id,
      testerName: req.user.name,
      assignedToDeveloperId: assignedDeveloper?._id || null,
      assignedToDeveloperName: assignedDeveloper?.name || "",
      assignedAt: assignedDeveloper ? new Date() : null,
      assignedTo: assignedDeveloper?._id || null,
      source: "manual",
      uploadBatchId: req.body.uploadBatchId || "",
      headers: req.body.headers || Object.keys(rawData),
      rawData,
      comments: [],
      actionHistory: [],
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

    if (
      req.user.role === "developer" &&
      String(testCase.assignedToDeveloperId) !== String(req.user._id)
    ) {
      return res.status(403).json({ message: "You can only modify assigned test cases" });
    }

    if (
      req.user.role === "developer" &&
      (req.body.assignedToDeveloperId !== undefined || req.body.assignedTo !== undefined)
    ) {
      return res.status(403).json({ message: "Developers cannot change assignment" });
    }

    const editableFields = [
      "description",
      "steps",
      "expectedResult",
      "scenarioId",
      "sheetName",
      "project",
    ];

    editableFields.forEach((field) => {
      if (req.body[field] !== undefined) {
        testCase[field] = req.body[field];
      }
    });

    const previousStatus = testCase.status;
    const developerUpdate =
      req.user.role === "developer" && req.body.status && req.body.status !== testCase.status;

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
    }

    if (req.body.assignedToDeveloperId !== undefined || req.body.assignedTo !== undefined) {
      const assignedDeveloper = await findDeveloper(
        req.body.assignedToDeveloperId || req.body.assignedTo || null
      ).catch((error) => {
        if (req.body.assignedToDeveloperId || req.body.assignedTo) {
          throw error;
        }

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
        message: assignedDeveloper
          ? `Assigned to ${assignedDeveloper.name}`
          : "Assignment cleared",
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
      if (assignedToDeveloperId || assignedTo) {
        throw error;
      }

      return null;
    });

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
    return res.json(populated);
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

const addComment = async (req, res) => {
  try {
    const { text } = req.body;

    if (!text) {
      return res.status(400).json({ message: "Comment text is required" });
    }

    const testCase = await TestCase.findById(req.params.id);

    if (!testCase) {
      return res.status(404).json({ message: "Test case not found" });
    }

    testCase.comments.push({
      userId: req.user._id,
      userName: req.user.name,
      comment: text,
      timestamp: new Date(),
    });

    pushAction(testCase, {
      type: "comment_added",
      userId: req.user._id,
      userName: req.user.name,
      message: `Added comment: ${text.slice(0, 80)}`,
    });

    await testCase.save();

    const populated = await TestCase.findById(testCase._id).populate(basePopulate);
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

    const workbook = XLSX.read(req.file.buffer, { type: "buffer" });
    const project = req.body.project || undefined;
    const uploadBatchId = `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
    const assignedDeveloper = await findDeveloper(
      req.body.assignedToDeveloperId || req.body.assignedTo || null
    ).catch((error) => {
      if (req.body.assignedToDeveloperId || req.body.assignedTo) {
        throw error;
      }

      return null;
    });
    const documents = [];

    workbook.SheetNames.forEach((sheetName) => {
      const worksheet = workbook.Sheets[sheetName];
      const rows = XLSX.utils.sheet_to_json(worksheet, { defval: "" });

      rows.forEach((row, index) => {
        const headers = Object.keys(row);
        const rawData = normalizeRawData(row);
        const scenarioId = rowValue(rawData, [
          "Scenario ID",
          "ScenarioId",
          "scenarioId",
          "scenario_id",
        ]);

        if (!scenarioId) {
          return;
        }

        documents.push({
          testerId: req.user._id,
          testerName: req.user.name,
          sheetName,
          scenarioId,
          description: rowValue(rawData, ["Description", "description"]),
          steps: rowValue(rawData, ["Steps", "steps"]),
          expectedResult: rowValue(rawData, [
            "Expected Result",
            "expectedResult",
            "Expected",
          ]),
          priority: normalizePriority(rowValue(rawData, ["Priority", "priority"])),
          status: assignedDeveloper
            ? "Assigned"
            : normalizeStatus(rowValue(rawData, ["Status", "status"])),
          assignedToDeveloperId: assignedDeveloper?._id || null,
          assignedToDeveloperName: assignedDeveloper?.name || "",
          assignedAt: assignedDeveloper ? new Date() : null,
          assignedTo: assignedDeveloper?._id || null,
          project,
          source: "excel",
          sourceFileName: req.file.originalname,
          uploadBatchId,
          headers,
          rawData,
          excelRowNumber: index + 2,
          comments: [],
          actionHistory: [
            {
              type: "created",
              userId: req.user._id,
              userName: req.user.name,
              message: `Imported from ${sheetName} row ${index + 2}`,
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

    const chunkSize = 500;
    for (let start = 0; start < documents.length; start += chunkSize) {
      const chunk = documents.slice(start, start + chunkSize);
      await TestCase.insertMany(chunk, { ordered: false });
    }

    const testCases = await TestCase.find({
      testerId: req.user._id,
      uploadBatchId,
    })
      .populate(basePopulate)
      .sort({ sheetName: 1, excelRowNumber: 1 });

    return res.status(201).json({
      message: `${documents.length} test cases uploaded`,
      uploadBatchId,
      sheetNames: [...new Set(documents.map((item) => item.sheetName))],
      testCases,
    });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

const exportExcel = async (req, res) => {
  try {
    const query = { ...accessibleQuery(req.user) };

    if (req.query.project) {
      query.project = req.query.project;
    }

    if (req.query.sheetName) {
      query.sheetName = req.query.sheetName;
    }

    if (req.query.uploadBatchId) {
      query.uploadBatchId = req.query.uploadBatchId;
    }

    const testCases = await TestCase.find(query)
      .populate(basePopulate)
      .sort({ sheetName: 1, excelRowNumber: 1, createdAt: -1 });

    if (!testCases.length) {
      return res.status(404).json({ message: "No test cases found for export" });
    }

    const workbook = XLSX.utils.book_new();
    const groups = testCases.reduce((accumulator, item) => {
      const key = item.sheetName || "Sheet1";
      if (!accumulator[key]) {
        accumulator[key] = [];
      }
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

      const rows = items.map((item) => {
        const row = {};
        headers.forEach((header) => {
          if (header === "Assigned To") {
            row[header] = item.assignedToDeveloperName || item.assignedToDeveloperId?.name || "";
          } else if (header === "Status") {
            row[header] = item.status;
          } else {
            row[header] = item.rawData?.[header] ?? "";
          }
        });
        return row;
      });

      const worksheet = XLSX.utils.json_to_sheet(rows, { header: headers });
      XLSX.utils.book_append_sheet(workbook, worksheet, sheetName.slice(0, 31));
    });

    const buffer = XLSX.write(workbook, { type: "buffer", bookType: "xlsx" });

    res.setHeader(
      "Content-Type",
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
    );
    res.setHeader("Content-Disposition", 'attachment; filename="testflow-testcases.xlsx"');

    return res.send(buffer);
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

module.exports = {
  getTestCases,
  createTestCase,
  updateTestCase,
  assignTestCase,
  addComment,
  uploadExcel,
  exportExcel,
};
