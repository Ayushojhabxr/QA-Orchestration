import { useEffect, useMemo, useState } from "react";
import AnimatedPage from "../../components/AnimatedPage";
import DeveloperKanbanBoard from "../../components/DeveloperKanbanBoard";
import GlassCard from "../../components/GlassCard";
import GlowButton from "../../components/GlowButton";
import StatCard from "../../components/StatCard";
import WorkflowTimeline from "../../components/WorkflowTimeline";
import DashboardLayout from "../../layouts/DashboardLayout";
import { addComment, getTestCases, updateTestCase } from "../../services/testCaseService";

const priorityOptions = ["All", "Low", "Medium", "High", "Critical"];
const statusOptions = ["All", "Pending", "Assigned", "In Progress", "Fixed", "Closed"];

const statusForwardMap = {
  Pending: ["In Progress"],
  Assigned: ["In Progress"],
  "In Progress": ["Fixed"],
  Fixed: ["Closed"],
  Closed: [],
};

const toBoardColumn = (status) => (status === "Assigned" ? "Pending" : status);

function DeveloperDashboard() {
  const [items, setItems] = useState([]);
  const [sheetNames, setSheetNames] = useState([]);
  const [testerNames, setTesterNames] = useState([]);
  const [filters, setFilters] = useState({
    testerName: "All",
    sheetName: "All",
    priority: "All",
    status: "All",
  });
  const [selectedCaseId, setSelectedCaseId] = useState("");
  const [commentDraft, setCommentDraft] = useState("");

  const loadCases = async () => {
    const response = await getTestCases();
    setItems(response.items || []);
    setSheetNames(response.sheetNames || []);
    setTesterNames(response.testerNames || []);
  };

  useEffect(() => {
    loadCases();
  }, []);

  const filteredItems = useMemo(
    () =>
      items.filter((item) => {
        const testerMatch =
          filters.testerName === "All" || item.testerName === filters.testerName;
        const sheetMatch = filters.sheetName === "All" || item.sheetName === filters.sheetName;
        const priorityMatch = filters.priority === "All" || item.priority === filters.priority;
        const statusMatch = filters.status === "All" || item.status === filters.status;
        return testerMatch && sheetMatch && priorityMatch && statusMatch;
      }),
    [filters, items]
  );

  useEffect(() => {
    if (!filteredItems.length) {
      setSelectedCaseId("");
      return;
    }

    if (!selectedCaseId || !filteredItems.some((item) => item._id === selectedCaseId)) {
      setSelectedCaseId(filteredItems[0]._id);
    }
  }, [filteredItems, selectedCaseId]);

  const groupedItems = useMemo(() => {
    const groups = {
      Pending: [],
      "In Progress": [],
      Fixed: [],
      Closed: [],
    };

    filteredItems.forEach((item) => {
      groups[toBoardColumn(item.status)].push(item);
    });

    return groups;
  }, [filteredItems]);

  const selectedItem =
    filteredItems.find((item) => item._id === selectedCaseId) || filteredItems[0] || null;

  const summary = {
    assignedBugs: items.length,
    highPriority: items.filter((item) => ["High", "Critical"].includes(item.priority)).length,
    pendingFix: items.filter((item) => !["Fixed", "Closed"].includes(item.status)).length,
    closed: items.filter((item) => item.status === "Closed").length,
  };

  const handleDragEnd = async ({ destination, source, draggableId }) => {
    if (!destination) return;
    if (
      destination.droppableId === source.droppableId &&
      destination.index === source.index
    ) {
      return;
    }

    const currentItem = items.find((item) => item._id === draggableId);
    if (!currentItem) return;

    const targetColumn = destination.droppableId;
    if (targetColumn === "Pending") {
      return;
    }

    const nextStatus = targetColumn;
    if (!(statusForwardMap[currentItem.status] || []).includes(nextStatus)) {
      return;
    }

    await updateTestCase(draggableId, { status: nextStatus });
    await loadCases();
    setSelectedCaseId(draggableId);
  };

  return (
    <AnimatedPage>
      <DashboardLayout
        title="Developer Workflow Grid"
        subtitle="Triage assigned bugs across a draggable workflow board, filter by source and urgency, and inspect a full action timeline per scenario."
      >
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <StatCard label="Assigned Bugs" value={summary.assignedBugs} accent="#5eead4" />
          <StatCard label="High Priority" value={summary.highPriority} accent="#f97316" />
          <StatCard label="Pending Fix" value={summary.pendingFix} accent="#38bdf8" />
          <StatCard label="Closed" value={summary.closed} accent="#a78bfa" />
        </div>

        <GlassCard className="mt-6 p-5">
          <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
            <select
              value={filters.testerName}
              onChange={(event) =>
                setFilters((current) => ({ ...current, testerName: event.target.value }))
              }
              className="rounded-2xl border border-slate-700 bg-slate-950/70 px-4 py-3 text-sm text-slate-100"
            >
              <option value="All">All Testers</option>
              {testerNames.map((testerName) => (
                <option key={testerName} value={testerName}>
                  {testerName}
                </option>
              ))}
            </select>
            <select
              value={filters.sheetName}
              onChange={(event) =>
                setFilters((current) => ({ ...current, sheetName: event.target.value }))
              }
              className="rounded-2xl border border-slate-700 bg-slate-950/70 px-4 py-3 text-sm text-slate-100"
            >
              <option value="All">All Sheets</option>
              {sheetNames.map((sheetName) => (
                <option key={sheetName} value={sheetName}>
                  {sheetName}
                </option>
              ))}
            </select>
            <select
              value={filters.priority}
              onChange={(event) =>
                setFilters((current) => ({ ...current, priority: event.target.value }))
              }
              className="rounded-2xl border border-slate-700 bg-slate-950/70 px-4 py-3 text-sm text-slate-100"
            >
              {priorityOptions.map((priority) => (
                <option key={priority} value={priority}>
                  {priority === "All" ? "All Priorities" : `${priority} Priority`}
                </option>
              ))}
            </select>
            <select
              value={filters.status}
              onChange={(event) =>
                setFilters((current) => ({ ...current, status: event.target.value }))
              }
              className="rounded-2xl border border-slate-700 bg-slate-950/70 px-4 py-3 text-sm text-slate-100"
            >
              {statusOptions.map((status) => (
                <option key={status} value={status}>
                  {status === "All" ? "All Statuses" : status}
                </option>
              ))}
            </select>
          </div>
        </GlassCard>

        <div className="mt-6 grid gap-5">
          {filteredItems.map((item) => (
            <GlassCard key={item._id} className="p-6">
              <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
                <div className="max-w-3xl">
                  <p className="text-xs uppercase tracking-[0.28em] text-slate-500">
                    {item.sheetName} • {item.priority}
                  </p>
                  <h2 className="mt-3 font-display text-2xl font-semibold text-white">
                    {item.scenarioId}
                  </h2>
                  <p className="mt-3 text-slate-300">{item.description}</p>
                  <div className="mt-4 grid gap-4 md:grid-cols-2">
                    <div className="rounded-2xl border border-slate-800 bg-slate-950/40 p-4">
                      <p className="text-xs uppercase tracking-[0.22em] text-slate-500">Steps</p>
                      <p className="mt-2 text-sm text-slate-300">{item.steps}</p>
                    </div>
                    <div className="rounded-2xl border border-slate-800 bg-slate-950/40 p-4">
                      <p className="text-xs uppercase tracking-[0.22em] text-slate-500">Expected Result</p>
                      <p className="mt-2 text-sm text-slate-300">{item.expectedResult}</p>
                    </div>
                  </div>
                </div>
                <div className="w-full max-w-xs rounded-2xl border border-slate-800 bg-slate-950/40 p-4">
                  <p className="text-xs uppercase tracking-[0.22em] text-slate-500">Status</p>
                  <select
                    value={item.status}
                    onChange={async (event) => {
                      await updateTestCase(item._id, { status: event.target.value });
                      await loadCases();
                    }}
                    className="mt-3 w-full rounded-xl border border-slate-700 bg-slate-950/80 px-3 py-2 text-sm text-slate-100"
                  >
                    {statuses.map((status) => (
                      <option key={status} value={status}>
                        {status}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="mt-6 grid gap-4 xl:grid-cols-[1.05fr_0.95fr]">
                <div className="rounded-2xl border border-slate-800 bg-slate-950/40 p-4">
                  <p className="text-xs uppercase tracking-[0.22em] text-slate-500">Comments</p>
                  <div className="mt-3 space-y-3">
                    {(item.comments || []).map((comment) => (
                      <div key={comment._id} className="rounded-2xl border border-slate-800 bg-slate-950/50 p-3">
                        <p className="text-sm font-semibold text-white">{comment.user?.name || "User"}</p>
                        <p className="mt-1 text-sm text-slate-300">{comment.text}</p>
                      </div>
                    ))}
                    {!item.comments?.length ? <p className="text-sm text-slate-400">No comments yet.</p> : null}
                  </div>
                </div>
                <div className="rounded-2xl border border-slate-800 bg-slate-950/40 p-4">
                  <p className="text-xs uppercase tracking-[0.22em] text-slate-500">Add Comment</p>
                  <textarea
                    rows="5"
                    value={commentDrafts[item._id] || ""}
                    onChange={(event) =>
                      setCommentDrafts((current) => ({
                        ...current,
                        [item._id]: event.target.value,
                      }))
                    }
                    className="mt-3 w-full rounded-2xl border border-slate-700 bg-slate-950/80 px-4 py-3 text-sm text-slate-100"
                    placeholder="Document the fix, blocker, or verification note..."
                  />
                  <GlowButton
                    type="button"
                    className="mt-4"
                    onClick={async () => {
                      const text = commentDrafts[item._id];
                      if (!text) return;
                      await addComment(item._id, text);
                      setCommentDrafts((current) => ({ ...current, [item._id]: "" }));
                      await loadCases();
                    }}
                  >
                    Post Comment
                  </GlowButton>
                </div>
              </div>
            </GlassCard>
          ))}
          {!filteredItems.length ? (
            <GlassCard className="p-8 text-center text-slate-400">
              No assigned test cases match the current filters.
            </GlassCard>
          ) : null}
        </div>
      </DashboardLayout>
    </AnimatedPage>
  );
}

export default DeveloperDashboard;
