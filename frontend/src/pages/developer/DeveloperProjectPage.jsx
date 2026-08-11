import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import AnimatedPage from "../../components/AnimatedPage";
import DeveloperKanbanBoard from "../../components/DeveloperKanbanBoard";
import GlassCard from "../../components/GlassCard";
import ProjectCaseTable from "../../components/ProjectCaseTable";
import DashboardLayout from "../../layouts/DashboardLayout";
import { getProjectById } from "../../services/projectService";
import { getTestCases, updateTestCase } from "../../services/testCaseService";

function DeveloperProjectPage() {
  const navigate = useNavigate();
  const { id } = useParams();
  const [project, setProject] = useState(null);
  const [items, setItems] = useState([]);
  const [sheetNames, setSheetNames] = useState([]);
  const [activeSheet, setActiveSheet] = useState("All");
  const [view, setView] = useState("table");

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
        title={project?.name || "Developer Project"}
        subtitle="Work assigned cases within this project, filter by sheet tabs, and switch between table and kanban execution views."
      >
        <GlassCard className="p-5">
          <div className="flex flex-wrap items-center gap-3">
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
              {["table", "kanban"].map((mode) => (
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
        </GlassCard>

        <div className="mt-6">
          {view === "table" ? (
            <ProjectCaseTable rows={filteredItems} baseDetailPath={`/developer/project/${id}/testcases`} />
          ) : (
            <DeveloperKanbanBoard
              groupedItems={groupedItems}
              selectedId=""
              onSelect={(item) => navigate(`/developer/project/${id}/testcases/${item._id}`)}
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

export default DeveloperProjectPage;
