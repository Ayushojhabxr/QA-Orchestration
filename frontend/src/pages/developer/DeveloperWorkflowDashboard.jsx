import { useEffect, useMemo, useState } from "react";
import AnimatedPage from "../../components/AnimatedPage";
import DeveloperKanbanBoard from "../../components/DeveloperKanbanBoard";
import GlassCard from "../../components/GlassCard";
import GlowButton from "../../components/GlowButton";
import LoadingSkeleton from "../../components/LoadingSkeleton";
import StatCard from "../../components/StatCard";
import WorkflowTimeline from "../../components/WorkflowTimeline";
import DashboardLayout from "../../layouts/DashboardLayout";
import { getSocket } from "../../services/socketService";
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

function DeveloperWorkflowDashboard() {
  const [items, setItems] = useState([]);
  const [sheetNames, setSheetNames] = useState([]);
  const [testerNames, setTesterNames] = useState([]);
  const [projects, setProjects] = useState([]);
  const [filters, setFilters] = useState({
    testerName: "All",
    sheetName: "All",
    project: "All",
    priority: "All",
    status: "All",
  });
  const [selectedCaseId, setSelectedCaseId] = useState("");
  const [commentDraft, setCommentDraft] = useState("");
  const [loading, setLoading] = useState(true);

  const loadCases = async () => {
    setLoading(true);
    const response = await getTestCases();
    setItems(response.items || []);
    setSheetNames(response.sheetNames || []);
    setTesterNames(response.testerNames || []);
    setProjects(response.projects || []);
    setLoading(false);
  };

  useEffect(() => {
    loadCases();
  }, []);

  useEffect(() => {
    const socket = getSocket();
    if (!socket) {
      return undefined;
    }

    const handleRealtimeUpdate = async () => {
      await loadCases();
    };

    socket.on("testcase:status_changed", handleRealtimeUpdate);
    socket.on("testcase:comment_added", handleRealtimeUpdate);
    socket.on("testcase:assigned", handleRealtimeUpdate);
    socket.on("testcase:updated", handleRealtimeUpdate);

    return () => {
      socket.off("testcase:status_changed", handleRealtimeUpdate);
      socket.off("testcase:comment_added", handleRealtimeUpdate);
      socket.off("testcase:assigned", handleRealtimeUpdate);
      socket.off("testcase:updated", handleRealtimeUpdate);
    };
  }, []);

  const filteredItems = useMemo(
    () =>
      items.filter((item) => {
        const testerMatch =
          filters.testerName === "All" || item.testerName === filters.testerName;
        const sheetMatch = filters.sheetName === "All" || item.sheetName === filters.sheetName;
        const projectMatch =
          filters.project === "All" ||
          item.project?._id === filters.project ||
          item.project === filters.project;
        const priorityMatch = filters.priority === "All" || item.priority === filters.priority;
        const statusMatch = filters.status === "All" || item.status === filters.status;
        return testerMatch && sheetMatch && projectMatch && priorityMatch && statusMatch;
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
          <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-5">
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
              value={filters.project}
              onChange={(event) =>
                setFilters((current) => ({ ...current, project: event.target.value }))
              }
              className="rounded-2xl border border-slate-700 bg-slate-950/70 px-4 py-3 text-sm text-slate-100"
            >
              <option value="All">All Projects</option>
              {projects.map((project) => (
                <option key={project._id} value={project._id}>
                  {project.name}
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

        <div className="mt-6 grid gap-6 2xl:grid-cols-[1.45fr_0.95fr]">
          <div className="min-w-0">
            {loading ? (
              <LoadingSkeleton className="h-[720px]" />
            ) : (
              <DeveloperKanbanBoard
                groupedItems={groupedItems}
                onDragEnd={handleDragEnd}
                onSelect={(item) => setSelectedCaseId(item._id)}
                selectedId={selectedCaseId}
              />
            )}
          </div>

          <div className="space-y-6">
            <GlassCard className="p-6">
              {loading ? (
                <LoadingSkeleton className="h-[560px]" />
              ) : selectedItem ? (
                <>
                  <div className="flex flex-wrap items-start justify-between gap-4">
                    <div>
                      <p className="text-xs uppercase tracking-[0.22em] text-slate-500">
                        {selectedItem.project?.name || "No Project"} / {selectedItem.sheetName} / {selectedItem.priority}
                      </p>
                      <h2 className="mt-3 font-display text-3xl font-semibold text-white">
                        {selectedItem.scenarioId}
                      </h2>
                    </div>
                    <div className="rounded-2xl border border-slate-800 bg-slate-950/50 px-4 py-3 text-sm text-slate-300">
                      <p>Tester: {selectedItem.testerName}</p>
                      <p className="mt-1">
                        Assigned: {selectedItem.assignedToDeveloperName || "Unassigned"}
                      </p>
                      <p className="mt-1">Status: {selectedItem.status}</p>
                    </div>
                  </div>

                  <div className="mt-5 grid gap-4">
                    <div className="rounded-2xl border border-slate-800 bg-slate-950/40 p-4">
                      <p className="text-xs uppercase tracking-[0.2em] text-slate-500">Description</p>
                      <p className="mt-2 text-sm text-slate-300">{selectedItem.description}</p>
                    </div>
                    <div className="rounded-2xl border border-slate-800 bg-slate-950/40 p-4">
                      <p className="text-xs uppercase tracking-[0.2em] text-slate-500">Steps</p>
                      <p className="mt-2 text-sm text-slate-300">{selectedItem.steps}</p>
                    </div>
                    <div className="rounded-2xl border border-slate-800 bg-slate-950/40 p-4">
                      <p className="text-xs uppercase tracking-[0.2em] text-slate-500">
                        Expected Result
                      </p>
                      <p className="mt-2 text-sm text-slate-300">{selectedItem.expectedResult}</p>
                    </div>
                  </div>

                  <div className="mt-5 rounded-2xl border border-slate-800 bg-slate-950/40 p-4">
                    <div className="flex items-center justify-between">
                      <p className="text-xs uppercase tracking-[0.2em] text-slate-500">Comments</p>
                      <span className="text-xs text-slate-500">
                        {selectedItem.comments?.length || 0} total
                      </span>
                    </div>
                    <div className="mt-3 space-y-3">
                      {(selectedItem.comments || []).map((comment) => (
                        <div
                          key={comment._id}
                          className="rounded-2xl border border-slate-800 bg-slate-950/50 p-3"
                        >
                          <div className="flex items-center justify-between gap-3">
                            <p className="text-sm font-semibold text-white">{comment.userName}</p>
                            <p className="text-xs text-slate-500">
                              {new Date(comment.timestamp).toLocaleString()}
                            </p>
                          </div>
                          <p className="mt-2 text-sm text-slate-300">{comment.comment}</p>
                        </div>
                      ))}
                      {!selectedItem.comments?.length ? (
                        <p className="text-sm text-slate-400">No comments recorded yet.</p>
                      ) : null}
                    </div>

                    <textarea
                      rows="4"
                      value={commentDraft}
                      onChange={(event) => setCommentDraft(event.target.value)}
                      className="mt-4 w-full rounded-2xl border border-slate-700 bg-slate-950/80 px-4 py-3 text-sm text-slate-100"
                      placeholder="Add an implementation note, blocker, or fix summary..."
                    />
                    <GlowButton
                      type="button"
                      className="mt-4"
                      onClick={async () => {
                        if (!selectedItem || !commentDraft.trim()) return;
                        await addComment(selectedItem._id, commentDraft.trim());
                        setCommentDraft("");
                        await loadCases();
                      }}
                    >
                      Add Comment
                    </GlowButton>
                  </div>
                </>
              ) : (
                <p className="text-sm text-slate-400">No bug selected.</p>
              )}
            </GlassCard>

            {loading ? <LoadingSkeleton className="h-[320px]" /> : <WorkflowTimeline actions={selectedItem?.actionHistory || []} />}
          </div>
        </div>
      </DashboardLayout>
    </AnimatedPage>
  );
}

export default DeveloperWorkflowDashboard;
