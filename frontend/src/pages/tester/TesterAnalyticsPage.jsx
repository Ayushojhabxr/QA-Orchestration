import { useEffect, useMemo, useState } from "react";
import AnimatedPage from "../../components/AnimatedPage";
import ChartCard from "../../components/ChartCard";
import LoadingSkeleton from "../../components/LoadingSkeleton";
import StatCard from "../../components/StatCard";
import DashboardLayout from "../../layouts/DashboardLayout";
import { getProjects } from "../../services/projectService";
import { getTestCases } from "../../services/testCaseService";

function TesterAnalyticsPage() {
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

  const priorityDistribution = useMemo(
    () =>
      ["Low", "Medium", "High", "Critical"].map((priority) => ({
        name: priority,
        value: testCases.filter((item) => item.priority === priority).length,
      })),
    [testCases]
  );

  const statusDistribution = useMemo(
    () =>
      ["Pending", "Assigned", "In Progress", "Testing", "Fixed", "Closed"].map((status) => ({
        name: status,
        value: testCases.filter((item) => item.status === status).length,
      })),
    [testCases]
  );

  const sheetDistribution = useMemo(() => {
    const map = testCases.reduce((accumulator, item) => {
      accumulator[item.sheetName] = (accumulator[item.sheetName] || 0) + 1;
      return accumulator;
    }, {});
    return Object.entries(map).map(([name, value]) => ({ name, value }));
  }, [testCases]);

  return (
    <AnimatedPage>
      <DashboardLayout
        title="Tester Analytics"
        subtitle="Track assigned projects, authored test cases, and the distribution of your QA workload."
      >
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
          <StatCard label="Assigned Projects" value={projects.length} accent="#38bdf8" />
          <StatCard label="Created Cases" value={testCases.length} accent="#5eead4" />
          <StatCard
            label="Pending"
            value={testCases.filter((item) => item.status === "Pending").length}
            accent="#f97316"
          />
          <StatCard
            label="In Progress"
            value={testCases.filter((item) => item.status === "In Progress").length}
            accent="#a78bfa"
          />
          <StatCard
            label="Fixed"
            value={testCases.filter((item) => item.status === "Fixed").length}
            accent="#22c55e"
          />
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
                title="Priority Distribution"
                subtitle="Priority breakdown across authored test cases."
                data={priorityDistribution}
                dataKey="value"
              />
              <ChartCard
                title="Status Distribution"
                subtitle="Current workflow state of your cases."
                data={statusDistribution}
                dataKey="value"
                type="pie"
              />
              <ChartCard
                title="Sheet-wise Distribution"
                subtitle="How test cases are spread by uploaded sheet."
                data={sheetDistribution}
                dataKey="value"
              />
            </>
          )}
        </div>
      </DashboardLayout>
    </AnimatedPage>
  );
}

export default TesterAnalyticsPage;
