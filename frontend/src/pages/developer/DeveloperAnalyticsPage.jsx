import { useEffect, useMemo, useState } from "react";
import AnimatedPage from "../../components/AnimatedPage";
import ChartCard from "../../components/ChartCard";
import LoadingSkeleton from "../../components/LoadingSkeleton";
import StatCard from "../../components/StatCard";
import DashboardLayout from "../../layouts/DashboardLayout";
import { getProjects } from "../../services/projectService";
import { getTestCases } from "../../services/testCaseService";

function DeveloperAnalyticsPage() {
  const [projects, setProjects] = useState([]);
  const [testCases, setTestCases] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      const [projectData, testCaseData] = await Promise.all([getProjects(), getTestCases()]);
      setProjects(projectData);
      setTestCases(testCaseData.items || []);
      setLoading(false);
    };

    load();
  }, []);

  const workloadPerProject = useMemo(() => {
    const map = testCases.reduce((accumulator, item) => {
      const name = item.project?.name || "No Project";
      accumulator[name] = (accumulator[name] || 0) + 1;
      return accumulator;
    }, {});
    return Object.entries(map).map(([name, value]) => ({ name, value }));
  }, [testCases]);

  const statusDistribution = useMemo(
    () =>
      ["Pending", "Assigned", "In Progress", "Testing", "Fixed", "Closed"].map((status) => ({
        name: status,
        value: testCases.filter((item) => item.status === status).length,
      })),
    [testCases]
  );

  const priorityBreakdown = useMemo(
    () =>
      ["Low", "Medium", "High", "Critical"].map((priority) => ({
        name: priority,
        value: testCases.filter((item) => item.priority === priority).length,
      })),
    [testCases]
  );

  return (
    <AnimatedPage>
      <DashboardLayout
        title="Developer Analytics"
        subtitle="Monitor assigned projects, active work, fixed issues, and project-level delivery load."
      >
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
          <StatCard label="Assigned Projects" value={projects.length} accent="#38bdf8" />
          <StatCard label="Assigned Cases" value={testCases.length} accent="#5eead4" />
          <StatCard
            label="In Progress"
            value={testCases.filter((item) => item.status === "In Progress").length}
            accent="#f97316"
          />
          <StatCard label="Fixed" value={testCases.filter((item) => item.status === "Fixed").length} accent="#22c55e" />
          <StatCard label="Closed" value={testCases.filter((item) => item.status === "Closed").length} accent="#a78bfa" />
        </div>

        <div className="mt-6 grid gap-6 xl:grid-cols-3">
          {loading ? (
            <>
              <LoadingSkeleton className="h-96" />
              <LoadingSkeleton className="h-96" />
              <LoadingSkeleton className="h-96" />
            </>
          ) : (
            <>
              <ChartCard
                title="Workload per Project"
                subtitle="Assigned cases grouped by project."
                data={workloadPerProject}
                dataKey="value"
              />
              <ChartCard
                title="Status Distribution"
                subtitle="Current workflow mix for your assigned cases."
                data={statusDistribution}
                dataKey="value"
                type="pie"
              />
              <ChartCard
                title="Priority Breakdown"
                subtitle="Priority load across your queue."
                data={priorityBreakdown}
                dataKey="value"
              />
            </>
          )}
        </div>
      </DashboardLayout>
    </AnimatedPage>
  );
}

export default DeveloperAnalyticsPage;
