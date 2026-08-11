const mongoose = require("mongoose");

const commentSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    userName: {
      type: String,
      required: true,
      trim: true,
    },
    comment: {
      type: String,
      required: true,
      trim: true,
    },
    mentions: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
      },
    ],
    timestamp: {
      type: Date,
      default: Date.now,
    },
  },
  { _id: true }
);

const actionSchema = new mongoose.Schema(
  {
    type: {
      type: String,
      enum: ["created", "assigned", "status_changed", "comment_added", "updated"],
      required: true,
    },
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    userName: {
      type: String,
      required: true,
      trim: true,
    },
    message: {
      type: String,
      required: true,
      trim: true,
    },
    fromStatus: {
      type: String,
      default: "",
    },
    toStatus: {
      type: String,
      default: "",
    },
    timestamp: {
      type: Date,
      default: Date.now,
    },
  },
  { _id: true }
);

const testCaseSchema = new mongoose.Schema(
  {
    testerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    testerName: {
      type: String,
      required: true,
      trim: true,
    },
    sheetName: {
      type: String,
      required: true,
      trim: true,
      index: true,
    },
    scenarioId: {
      type: String,
      required: true,
      trim: true,
      index: true,
    },
    description: {
      type: String,
      default: "",
    },
    steps: {
      type: String,
      default: "",
    },
    expectedResult: {
      type: String,
      default: "",
    },
    actualResult: {
      type: String,
      default: "",
    },
    priority: {
      type: String,
      enum: ["Low", "Medium", "High", "Critical"],
      default: "Medium",
    },
    status: {
      type: String,
      enum: ["Pending", "Assigned", "In Progress", "Testing", "Fixed", "Closed"],
      default: "Pending",
    },
    project: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Project",
      index: true,
    },
    assignedToDeveloperId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
      index: true,
    },
    assignedToDeveloperName: {
      type: String,
      default: "",
      trim: true,
    },
    assignedAt: {
      type: Date,
      default: null,
    },
    assignedTo: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
    source: {
      type: String,
      enum: ["manual", "excel"],
      default: "manual",
    },
    sourceFileName: {
      type: String,
      default: "",
    },
    uploadBatchId: {
      type: String,
      index: true,
      default: "",
    },
    headers: [
      {
        type: String,
      },
    ],
    rawData: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
    },
    aiSuggestions: {
      suggestedPriority: {
        type: String,
        enum: ["Low", "Medium", "High", "Critical", ""],
        default: "",
      },
      duplicateCandidates: [
        {
          type: mongoose.Schema.Types.ObjectId,
          ref: "TestCase",
        },
      ],
      duplicateCount: {
        type: Number,
        default: 0,
      },
    },
    excelRowNumber: {
      type: Number,
    },
    comments: [commentSchema],
    actionHistory: [actionSchema],
  },
  { timestamps: true }
);

testCaseSchema.index({ testerId: 1, project: 1, sheetName: 1, scenarioId: 1 });
testCaseSchema.index({ scenarioId: "text", testerName: "text", assignedToDeveloperName: "text", sheetName: "text" });

module.exports = mongoose.model("TestCase", testCaseSchema);
