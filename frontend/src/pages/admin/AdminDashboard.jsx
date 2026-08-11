import { useEffect, useMemo, useState } from "react";
import AnimatedPage from "../../components/AnimatedPage";
import ChartCard from "../../components/ChartCard";
import GlassCard from "../../components/GlassCard";
import LoadingSkeleton from "../../components/LoadingSkeleton";
import ProjectManager from "../../components/ProjectManager";
import StatCard from "../../components/StatCard";
import DashboardLayout from "../../layouts/DashboardLayout";
import { createProject, deleteProject, getProjects, updateProject } from "../../services/projectService";
import { getActivityFeed, getSystemAnalytics } from "../../services/systemService";
import { getTestCases } from "../../services/testCaseService";
import { getUsers, updateUserRole } from "../../services/userService";

function AdminDashboard() {
  const [users, setUsers] = useState([]);
  const [projects, setProjects] = useState([]);
  const [testCases, setTestCases] = useState([]);
  const [sheetNames, setSheetNames] = useState([]);
  const [activityItems, setActivityItems] = useState([]);
  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(true);

  const loadDashboard = async () => {
    setLoading(true);
    const [userData, projectData, testCaseData, analyticsData, activityData] = await Promise.all([
      getUsers(),
      getProjects(),
      getTestCases(),
      getSystemAnalytics(),
      getActivityFeed({ limit: 12 }),
    ]);

    setUsers(userData);
    setProjects(projectData);
    setTestCases(testCaseData.items || []);
    setSheetNames(testCaseData.sheetNames || []);
    setAnalytics(analyticsData);
    setActivityItems(activityData.items || []);
    setLoading(false);
  };

  useEffect(() => {
    loadDashboard();
  }, []);

  const roleCounts = users.reduce(
    (accumulator, user) => {
      accumulator[user.role] += 1;
      return accumulator;
    },
    { admin: 0, developer: 0, tester: 0 }
  );

  const developerBugCounts = useMemo(
    () =>
      analytics?.developerLoad?.map((item) => ({
        name: item.name.split(" ")[0],
        bugs: item.assigned,
      })) || [],
    [analytics]
  );

  const progressDistribution = useMemo(
    () => analytics?.statusBreakdown || [],
    [analytics]
  );

  const priorityDistribution = useMemo(
    () => analytics?.priorityBreakdown || [],
    [analytics]
  );

  return (
    <AnimatedPage>
      <DashboardLayout
        title="Admin Command"
        subtitle="Oversee users, projects, and every uploaded test case in the system."
      >
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <StatCard label="Users" value={analytics?.counts?.users ?? users.length} accent="#38bdf8" />
          <StatCard label="Admins" value={roleCounts.admin} accent="#f97316" />
          <StatCard label="Developers" value={roleCounts.developer} accent="#5eead4" />
          <StatCard
            label="Test Cases"
            value={analytics?.counts?.testCases ?? testCases.length}
            accent="#a78bfa"
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
                title="Developer Bug Counts"
                subtitle="Assigned workload by developer."
                data={developerBugCounts}
                dataKey="bugs"
              />
              <ChartCard
                title="Test Case Progress"
                subtitle="Workflow distribution across the platform."
                data={progressDistribution}
                dataKey="value"
                type="pie"
              />
              <ChartCard
                title="Priority Distribution"
                subtitle="Severity mix across active scenarios."
                data={priorityDistribution}
                dataKey="value"
              />
            </>
          )}
        </div>

        <div className="mt-6 grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
          <GlassCard className="overflow-hidden">
            <div className="border-b border-slate-800 px-6 py-4">
              <h2 className="font-display text-2xl font-semibold text-white">Users & Roles</h2>
            </div>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-slate-800">
                <thead className="bg-slate-950/60">
                  <tr>
                    {["Name", "Email", "Role", "Created"].map((header) => (
                      <th
                        key={header}
                        className="px-6 py-4 text-left text-xs uppercase tracking-[0.25em] text-slate-400"
                      >
                        {header}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-900/80">
                  {users.map((user) => (
                    <tr key={user._id} className="transition hover:bg-slate-900/30">
                      <td className="px-6 py-4 text-white">{user.name}</td>
                      <td className="px-6 py-4 text-slate-300">{user.email}</td>
                      <td className="px-6 py-4">
                        <select
                          value={user.role}
                          onChange={async (event) => {
                            await updateUserRole(user._id, event.target.value);
                            await loadDashboard();
                          }}
                          className="rounded-xl border border-slate-700 bg-slate-950/80 px-3 py-2 text-sm text-slate-100"
                        >
                          <option value="admin">admin</option>
                          <option value="developer">developer</option>
                          <option value="tester">tester</option>
                        </select>
                      </td>
                      <td className="px-6 py-4 text-slate-400">
                        {new Date(user.createdAt).toLocaleDateString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </GlassCard>

          <GlassCard className="p-6">
            <h2 className="font-display text-2xl font-semibold text-white">Sheet Index</h2>
            <div className="mt-4 flex flex-wrap gap-3">
              {sheetNames.map((sheetName) => (
                <span
                  key={sheetName}
                  className="rounded-full border border-slate-700 bg-slate-950/70 px-4 py-2 text-sm text-slate-200"
                >
                  {sheetName}
                </span>
              ))}
              {!sheetNames.length ? <p className="text-sm text-slate-400">No sheets uploaded yet.</p> : null}
            </div>
            <div className="mt-6 space-y-3">
              {testCases.slice(0, 6).map((item) => (
                <div
                  key={item._id}
                  className="rounded-2xl border border-slate-800 bg-slate-950/50 p-4 transition hover:-translate-y-0.5 hover:border-glow"
                >
                  <p className="font-semibold text-white">
                    {item.scenarioId} <span className="text-slate-500">/ {item.sheetName}</span>
                  </p>
                  <p className="mt-1 text-sm text-slate-300">{item.description}</p>
                  <p className="mt-2 text-xs uppercase tracking-[0.25em] text-slate-500">
                    {item.priority} • {item.status} • {item.testerName}
                  </p>
                </div>
              ))}
            </div>
          </GlassCard>
        </div>

        <div className="mt-6">
          <ProjectManager
            projects={projects}
            users={users}
            onCreate={async (payload) => {
              await createProject(payload);
              await loadDashboard();
            }}
            onUpdate={async (id, payload) => {
              await updateProject(id, payload);
              await loadDashboard();
            }}
            onDelete={async (id) => {
              await deleteProject(id);
              await loadDashboard();
            }}
          />
        </div>

        <GlassCard className="mt-6 p-6">
          <div className="flex items-center justify-between">
            <h2 className="font-display text-2xl font-semibold text-white">System Activity</h2>
            <span className="text-xs uppercase tracking-[0.22em] text-slate-500">
              {activityItems.length} recent events
            </span>
          </div>
          <div className="mt-4 grid gap-3">
            {activityItems.map((item) => (
              <div key={item._id} className="rounded-2xl border border-slate-800 bg-slate-950/45 p-4">
                <p className="text-xs uppercase tracking-[0.2em] text-slate-500">{item.action}</p>
                <p className="mt-2 text-sm font-semibold text-white">{item.userName}</p>
                <p className="mt-1 text-sm text-slate-300">{item.target}</p>
                <p className="mt-2 text-xs text-slate-500">
                  {new Date(item.timestamp).toLocaleString()}
                </p>
              </div>
            ))}
            {!activityItems.length ? <p className="text-sm text-slate-400">No activity recorded yet.</p> : null}
          </div>
        </GlassCard>
      </DashboardLayout>
    </AnimatedPage>
  );
}

export default AdminDashboard;
