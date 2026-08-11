import { useEffect, useState } from "react";
import AnimatedPage from "../../components/AnimatedPage";
import DropzoneUpload from "../../components/DropzoneUpload";
import DynamicTestCaseTable from "../../components/DynamicTestCaseTable";
import GlassCard from "../../components/GlassCard";
import GlowButton from "../../components/GlowButton";
import LoadingSkeleton from "../../components/LoadingSkeleton";
import StatCard from "../../components/StatCard";
import DashboardLayout from "../../layouts/DashboardLayout";
import { getSocket } from "../../services/socketService";
import { getProjects } from "../../services/projectService";
import {
  assignTestCase,
  createTestCase,
  exportTestCases,
  getTestCases,
  updateTestCase,
  uploadExcelFile,
} from "../../services/testCaseService";
import { getDevelopers } from "../../services/userService";
import { downloadBlob } from "../../utils/downloadBlob";

function TesterDashboard() {
  const [items, setItems] = useState([]);
  const [sheetNames, setSheetNames] = useState([]);
  const [activeSheet, setActiveSheet] = useState("All");
  const [activeProject, setActiveProject] = useState("All");
  const [developers, setDevelopers] = useState([]);
  const [projects, setProjects] = useState([]);
  const [aiSuggestions, setAiSuggestions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [manualForm, setManualForm] = useState({
    project: "",
    sheetName: "Manual",
    scenarioId: "",
    description: "",
    steps: "",
    expectedResult: "",
    priority: "Medium",
  });

  const loadData = async () => {
    setLoading(true);
    const [testCaseData, developerData, projectData] = await Promise.all([
      getTestCases(),
      getDevelopers(),
      getProjects(),
    ]);

    setItems(testCaseData.items || []);
    setSheetNames(testCaseData.sheetNames || []);
    setDevelopers(developerData);
    setProjects(projectData);
    setLoading(false);
  };

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    const socket = getSocket();
    if (!socket) {
      return undefined;
    }

    const handleRealtimeUpdate = async () => {
      await loadData();
    };

    socket.on("testcase:status_changed", handleRealtimeUpdate);
    socket.on("testcase:comment_added", handleRealtimeUpdate);
    socket.on("testcase:assigned", handleRealtimeUpdate);
    socket.on("testcase:updated", handleRealtimeUpdate);
    socket.on("testcase:created", handleRealtimeUpdate);

    return () => {
      socket.off("testcase:status_changed", handleRealtimeUpdate);
      socket.off("testcase:comment_added", handleRealtimeUpdate);
      socket.off("testcase:assigned", handleRealtimeUpdate);
      socket.off("testcase:updated", handleRealtimeUpdate);
      socket.off("testcase:created", handleRealtimeUpdate);
    };
  }, []);

  const filteredRows = items.filter((item) => {
    const sheetMatch = activeSheet === "All" || item.sheetName === activeSheet;
    const projectMatch =
      activeProject === "All" ||
      item.project?._id === activeProject ||
      item.project === activeProject;
    return sheetMatch && projectMatch;
  });

  return (
    <AnimatedPage>
      <DashboardLayout
        title="Tester Upload Bay"
        subtitle="Upload multi-sheet workbooks, edit rows inline, assign developers, update lifecycle state, and export workbook tabs back out."
        actions={[
          <GlowButton
            key="export"
            type="button"
            variant="ghost"
            onClick={async () => {
              const params = {};
              if (activeSheet !== "All") params.sheetName = activeSheet;
              if (activeProject !== "All") params.project = activeProject;
              const blob = await exportTestCases(params);
              downloadBlob(blob, "testflow-testcases.xlsx");
            }}
          >
            Export Workbook
          </GlowButton>,
        ]}
      >
        <div className="grid gap-4 md:grid-cols-3">
          <StatCard label="Your Cases" value={items.length} accent="#5eead4" />
          <StatCard label="Sheets" value={sheetNames.length} accent="#38bdf8" />
          <StatCard
            label="Assigned"
            value={items.filter((item) => Boolean(item.assignedToDeveloperId)).length}
            accent="#f97316"
          />
        </div>

        <div className="mt-6 grid gap-6 xl:grid-cols-[1.15fr_0.85fr]">
          {loading ? (
            <>
              <LoadingSkeleton className="h-[420px]" />
              <LoadingSkeleton className="h-[420px]" />
            </>
          ) : (
            <>
              <DropzoneUpload
                projects={projects}
                onUpload={async ({ file, project, onUploadProgress }) => {
                  const response = await uploadExcelFile({ file, project, onUploadProgress });
                  setItems(response.testCases || []);
                  setSheetNames(response.sheetNames || []);
                  setAiSuggestions(response.aiSuggestions || []);
                  setActiveSheet(response.sheetNames?.[0] || "All");
                  setActiveProject(project || "All");
                }}
              />

              <GlassCard className="p-6">
                <p className="font-display text-xl font-semibold text-white">Create Manual Scenario</p>
                <p className="mt-2 text-sm text-slate-400">
                  Every scenario must be linked to an admin-created project.
                </p>
                <form
                  className="mt-4 grid gap-3"
                  onSubmit={async (event) => {
                    event.preventDefault();
                    if (!manualForm.project) return;
                    const rawData = {
                      "Scenario ID": manualForm.scenarioId,
                      Description: manualForm.description,
                      Steps: manualForm.steps,
                      "Expected Result": manualForm.expectedResult,
                      Priority: manualForm.priority,
                    };
                    await createTestCase({
                      ...manualForm,
                      project: manualForm.project || undefined,
                      rawData,
                      headers: Object.keys(rawData),
                    });
                    setManualForm({
                      project: "",
                      sheetName: "Manual",
                      scenarioId: "",
                      description: "",
                      steps: "",
                      expectedResult: "",
                      priority: "Medium",
                    });
                    await loadData();
                  }}
                >
                  <select
                    value={manualForm.project}
                    onChange={(event) =>
                      setManualForm((current) => ({ ...current, project: event.target.value }))
                    }
                    className="rounded-2xl border border-slate-700 bg-slate-950/60 px-4 py-3 text-slate-100"
                  >
                    <option value="">Select project</option>
                    {projects.map((project) => (
                      <option key={project._id} value={project._id}>
                        {project.name}
                      </option>
                    ))}
                  </select>
                  <input
                    value={manualForm.sheetName}
                    onChange={(event) =>
                      setManualForm((current) => ({ ...current, sheetName: event.target.value }))
                    }
                    placeholder="Sheet name"
                    className="rounded-2xl border border-slate-700 bg-slate-950/60 px-4 py-3 text-slate-100"
                  />
                  <input
                    value={manualForm.scenarioId}
                    onChange={(event) =>
                      setManualForm((current) => ({ ...current, scenarioId: event.target.value }))
                    }
                    placeholder="Scenario ID"
                    className="rounded-2xl border border-slate-700 bg-slate-950/60 px-4 py-3 text-slate-100"
                  />
                  <textarea
                    rows="2"
                    value={manualForm.description}
                    onChange={(event) =>
                      setManualForm((current) => ({ ...current, description: event.target.value }))
                    }
                    placeholder="Description"
                    className="rounded-2xl border border-slate-700 bg-slate-950/60 px-4 py-3 text-slate-100"
                  />
                  <textarea
                    rows="2"
                    value={manualForm.steps}
                    onChange={(event) =>
                      setManualForm((current) => ({ ...current, steps: event.target.value }))
                    }
                    placeholder="Steps"
                    className="rounded-2xl border border-slate-700 bg-slate-950/60 px-4 py-3 text-slate-100"
                  />
                  <textarea
                    rows="2"
                    value={manualForm.expectedResult}
                    onChange={(event) =>
                      setManualForm((current) => ({
                        ...current,
                        expectedResult: event.target.value,
                      }))
                    }
                    placeholder="Expected Result"
                    className="rounded-2xl border border-slate-700 bg-slate-950/60 px-4 py-3 text-slate-100"
                  />
                  <select
                    value={manualForm.priority}
                    onChange={(event) =>
                      setManualForm((current) => ({ ...current, priority: event.target.value }))
                    }
                    className="rounded-2xl border border-slate-700 bg-slate-950/60 px-4 py-3 text-slate-100"
                  >
                    {["Low", "Medium", "High", "Critical"].map((priority) => (
                      <option key={priority} value={priority}>
                        {priority}
                      </option>
                    ))}
                  </select>
                  <GlowButton type="submit" disabled={!manualForm.project}>
                    Add Scenario
                  </GlowButton>
                </form>
              </GlassCard>
            </>
          )}
        </div>

        <div className="mt-6 flex flex-wrap gap-3">
          <select
            value={activeProject}
            onChange={(event) => setActiveProject(event.target.value)}
            className="rounded-full border border-slate-700 bg-slate-950/60 px-4 py-2 text-sm text-slate-200"
          >
            <option value="All">All Projects</option>
            {projects.map((project) => (
              <option key={project._id} value={project._id}>
                {project.name}
              </option>
            ))}
          </select>
          <button
            type="button"
            onClick={() => setActiveSheet("All")}
            className={`rounded-full px-4 py-2 text-sm font-semibold ${
              activeSheet === "All"
                ? "bg-white text-slate-950"
                : "border border-slate-700 bg-slate-950/60 text-slate-200"
            }`}
          >
            All Sheets
          </button>
          {sheetNames.map((sheetName) => (
            <button
              type="button"
              key={sheetName}
              onClick={() => setActiveSheet(sheetName)}
              className={`rounded-full px-4 py-2 text-sm font-semibold ${
                activeSheet === sheetName
                  ? "bg-gradient-to-r from-glow to-aurora text-slate-950"
                  : "border border-slate-700 bg-slate-950/60 text-slate-200"
              }`}
            >
              {sheetName}
            </button>
          ))}
        </div>

        {aiSuggestions.length ? (
          <GlassCard className="mt-6 p-5">
            <div className="flex items-center justify-between">
              <h2 className="font-display text-xl font-semibold text-white">AI Suggestions</h2>
              <span className="text-xs uppercase tracking-[0.18em] text-slate-500">
                upload heuristics
              </span>
            </div>
            <div className="mt-4 grid gap-3 md:grid-cols-2 xl:grid-cols-3">
              {aiSuggestions.slice(0, 9).map((item) => (
                <div key={`${item.sheetName}-${item.scenarioId}`} className="rounded-2xl border border-slate-800 bg-slate-950/45 p-4">
                  <p className="font-semibold text-white">{item.scenarioId}</p>
                  <p className="mt-1 text-sm text-slate-400">{item.sheetName}</p>
                  <p className="mt-3 text-xs uppercase tracking-[0.18em] text-slate-500">
                    Suggested priority: {item.suggestedPriority || "Medium"}
                  </p>
                  <p className="mt-2 text-xs text-slate-500">
                    Duplicate candidates: {item.duplicateCount || 0}
                  </p>
                </div>
              ))}
            </div>
          </GlassCard>
        ) : null}

        <div className="mt-6">
          <DynamicTestCaseTable
            rows={filteredRows}
            developers={developers}
            onSaveRow={async (id, draft) => {
              await updateTestCase(id, {
                rawData: draft.rawData,
                headers: Object.keys(draft.rawData || {}),
                status: draft.status,
                assignedToDeveloperId: draft.assignedToDeveloperId || undefined,
              });
              await loadData();
            }}
            onAssignRow={async (id, assignedToDeveloperId) => {
              await assignTestCase(id, assignedToDeveloperId || undefined);
              await loadData();
            }}
            onStatusRow={async (id, status) => {
              await updateTestCase(id, { status });
              await loadData();
            }}
          />
        </div>
      </DashboardLayout>
    </AnimatedPage>
  );
}

export default TesterDashboard;
