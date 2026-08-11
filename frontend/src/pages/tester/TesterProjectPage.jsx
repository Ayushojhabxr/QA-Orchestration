import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import AnimatedPage from "../../components/AnimatedPage";
import DeveloperKanbanBoard from "../../components/DeveloperKanbanBoard";
import DropzoneUpload from "../../components/DropzoneUpload";
import DynamicTestCaseTable from "../../components/DynamicTestCaseTable";
import GlassCard from "../../components/GlassCard";
import GlowButton from "../../components/GlowButton";
import DashboardLayout from "../../layouts/DashboardLayout";
import { getProjectById } from "../../services/projectService";
import {
  assignTestCase,
  createTestCase,
  getTestCases,
  updateTestCase,
  uploadExcelFile,
} from "../../services/testCaseService";

const views = ["table", "kanban"];

function TesterProjectPage() {
  const navigate = useNavigate();
  const { id } = useParams();
  const [project, setProject] = useState(null);
  const [items, setItems] = useState([]);
  const [sheetNames, setSheetNames] = useState([]);
  const [activeSheet, setActiveSheet] = useState("All");
  const [view, setView] = useState("table");
  const [manualForm, setManualForm] = useState({
    sheetName: "Manual",
    scenarioId: "",
    description: "",
    steps: "",
    expectedResult: "",
    priority: "Medium",
  });

  const load = async () => {
    const [projectData, testCaseData] = await Promise.all([
      getProjectById(id),
      getTestCases({ project: id }),
    ]);
    setProject(projectData);
    setItems(testCaseData.items || []);
    setSheetNames(testCaseData.sheetNames || []);
  };

  useEffect(() => {
    load();
  }, [id]);

  const filteredItems = useMemo(
    () => items.filter((item) => activeSheet === "All" || item.sheetName === activeSheet),
    [activeSheet, items]
  );

  const groupedItems = useMemo(() => {
    const groups = { Pending: [], "In Progress": [], Testing: [], Fixed: [], Closed: [] };
    filteredItems.forEach((item) => {
      const column = item.status === "Assigned" ? "Pending" : item.status;
      groups[column] = groups[column] || [];
      groups[column].push(item);
    });
    return groups;
  }, [filteredItems]);

  return (
    <AnimatedPage>
      <DashboardLayout
        title={project?.name || "Tester Project"}
        subtitle="Upload categorized workbooks, manage project-bound test cases, and switch between table and kanban execution views."
      >
        <div className="grid gap-6 xl:grid-cols-[1.15fr_0.85fr]">
          <DropzoneUpload
            projects={project ? [project] : []}
            lockedProject={id}
            onUpload={async ({ file, onUploadProgress }) => {
              await uploadExcelFile({ file, project: id, onUploadProgress });
              await load();
            }}
          />

          <GlassCard className="p-6">
            <p className="font-display text-xl font-semibold text-white">Create Test Case</p>
            <form
              className="mt-4 grid gap-3"
              onSubmit={async (event) => {
                event.preventDefault();
                const rawData = {
                  "Scenario ID": manualForm.scenarioId,
                  Description: manualForm.description,
                  Steps: manualForm.steps,
                  "Expected Result": manualForm.expectedResult,
                  Priority: manualForm.priority,
                };
                await createTestCase({
                  ...manualForm,
                  project: id,
                  rawData,
                  headers: Object.keys(rawData),
                });
                setManualForm({
                  sheetName: "Manual",
                  scenarioId: "",
                  description: "",
                  steps: "",
                  expectedResult: "",
                  priority: "Medium",
                });
                await load();
              }}
            >
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
                rows="3"
                value={manualForm.description}
                onChange={(event) =>
                  setManualForm((current) => ({ ...current, description: event.target.value }))
                }
                placeholder="Description"
                className="rounded-2xl border border-slate-700 bg-slate-950/60 px-4 py-3 text-slate-100"
              />
              <textarea
                rows="3"
                value={manualForm.steps}
                onChange={(event) =>
                  setManualForm((current) => ({ ...current, steps: event.target.value }))
                }
                placeholder="Steps"
                className="rounded-2xl border border-slate-700 bg-slate-950/60 px-4 py-3 text-slate-100"
              />
              <textarea
                rows="3"
                value={manualForm.expectedResult}
                onChange={(event) =>
                  setManualForm((current) => ({ ...current, expectedResult: event.target.value }))
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
              <GlowButton type="submit">Add Test Case</GlowButton>
            </form>
          </GlassCard>
        </div>

        <div className="mt-6 flex flex-wrap items-center gap-3">
          {["All", ...sheetNames].map((sheetName) => (
            <button
              key={sheetName}
              type="button"
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
          <div className="ml-auto flex gap-2">
            {views.map((mode) => (
              <button
                key={mode}
                type="button"
                onClick={() => setView(mode)}
                className={`rounded-full px-4 py-2 text-sm font-semibold ${
                  view === mode
                    ? "bg-white text-slate-950"
                    : "border border-slate-700 bg-slate-950/60 text-slate-200"
                }`}
              >
                {mode}
              </button>
            ))}
          </div>
        </div>

        <div className="mt-6">
          {view === "table" ? (
            <DynamicTestCaseTable
              rows={filteredItems}
              developers={project?.developers || []}
              onSaveRow={async (testCaseId, draft) => {
                await updateTestCase(testCaseId, {
                  rawData: draft.rawData,
                  headers: Object.keys(draft.rawData || {}),
                  status: draft.status,
                  assignedToDeveloperId: draft.assignedToDeveloperId || undefined,
                });
                await load();
              }}
              onAssignRow={async (testCaseId, assignedToDeveloperId) => {
                await assignTestCase(testCaseId, assignedToDeveloperId || undefined);
                await load();
              }}
              onStatusRow={async (testCaseId, status) => {
                await updateTestCase(testCaseId, { status });
                await load();
              }}
            />
          ) : (
            <DeveloperKanbanBoard
              groupedItems={groupedItems}
              selectedId=""
              onSelect={(item) => navigate(`/tester/project/${id}/testcases/${item._id}`)}
              onDragEnd={async ({ destination, draggableId }) => {
                if (!destination) return;
                await updateTestCase(draggableId, { status: destination.droppableId });
                await load();
              }}
            />
          )}
        </div>
      </DashboardLayout>
    </AnimatedPage>
  );
}

export default TesterProjectPage;
