import { useEffect, useState } from "react";
import AnimatedPage from "../../components/AnimatedPage";
import ChartCard from "../../components/ChartCard";
import GlassCard from "../../components/GlassCard";
import LoadingSkeleton from "../../components/LoadingSkeleton";
import StatCard from "../../components/StatCard";
import DashboardLayout from "../../layouts/DashboardLayout";
import { getActivityFeed, getSystemAnalytics } from "../../services/systemService";

function AdminAnalyticsPage() {
  const [analytics, setAnalytics] = useState(null);
  const [activityItems, setActivityItems] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      const [analyticsData, activityData] = await Promise.all([
        getSystemAnalytics(),
        getActivityFeed({ limit: 12 }),
      ]);
      setAnalytics(analyticsData);
      setActivityItems(activityData.items || []);
      setLoading(false);
    };

    load();
  }, []);

  return (
    <AnimatedPage>
      <DashboardLayout
        title="Admin Analytics"
        subtitle="Platform-wide QA metrics, project progress, developer throughput, and recent operational activity."
      >
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <StatCard label="Total Projects" value={analytics?.counts?.projects ?? 0} accent="#38bdf8" />
          <StatCard label="Total Test Cases" value={analytics?.counts?.testCases ?? 0} accent="#5eead4" />
          <StatCard
            label="Total Developers"
            value={analytics?.developerLoad?.length ?? 0}
            accent="#f97316"
          />
          <StatCard label="Unread Alerts" value={analytics?.counts?.unreadNotifications ?? 0} accent="#a78bfa" />
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
                title="Status Distribution"
                subtitle="Current QA workflow distribution."
                data={analytics?.statusBreakdown || []}
                dataKey="value"
                type="pie"
              />
              <ChartCard
                title="Project Progress"
                subtitle="Test case volume per project."
                data={analytics?.projectHealth || []}
                dataKey="total"
              />
              <ChartCard
                title="Developer Productivity"
                subtitle="Assigned workload by developer."
                data={analytics?.developerLoad || []}
                dataKey="assigned"
              />
            </>
          )}
        </div>

        <GlassCard className="mt-6 p-6">
          <div className="flex items-center justify-between">
            <h2 className="font-display text-2xl font-semibold text-white">Activity Timeline</h2>
            <span className="text-xs uppercase tracking-[0.22em] text-slate-500">
              {activityItems.length} recent events
            </span>
          </div>
          <div className="mt-4 grid gap-3">
            {activityItems.map((item) => (
              <div key={item._id} className="rounded-2xl border border-slate-800 bg-slate-950/45 p-4">
                <p className="text-xs uppercase tracking-[0.18em] text-slate-500">{item.action}</p>
                <p className="mt-2 text-sm font-semibold text-white">{item.userName}</p>
                <p className="mt-1 text-sm text-slate-300">{item.target}</p>
                <p className="mt-2 text-xs text-slate-500">
                  {new Date(item.timestamp).toLocaleString()}
                </p>
              </div>
            ))}
          </div>
        </GlassCard>
      </DashboardLayout>
    </AnimatedPage>
  );
}

export default AdminAnalyticsPage;
