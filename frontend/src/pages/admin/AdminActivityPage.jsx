import { useEffect, useState } from "react";
import AnimatedPage from "../../components/AnimatedPage";
import GlassCard from "../../components/GlassCard";
import DashboardLayout from "../../layouts/DashboardLayout";
import { getActivityFeed } from "../../services/systemService";

function AdminActivityPage() {
  const [items, setItems] = useState([]);

  useEffect(() => {
    const load = async () => {
      const data = await getActivityFeed({ limit: 60 });
      setItems(data.items || []);
    };

    load();
  }, []);

  return (
    <AnimatedPage>
      <DashboardLayout
        title="System Activity"
        subtitle="Audit the recent project, user, and test case events happening across the platform."
      >
        <div className="grid gap-3">
          {items.map((item) => (
            <GlassCard key={item._id} className="p-5">
              <p className="text-xs uppercase tracking-[0.18em] text-slate-500">{item.action}</p>
              <p className="mt-2 text-sm font-semibold text-white">{item.userName}</p>
              <p className="mt-1 text-sm text-slate-300">{item.target}</p>
              <p className="mt-2 text-xs text-slate-500">
                {new Date(item.timestamp).toLocaleString()}
              </p>
            </GlassCard>
          ))}
        </div>
      </DashboardLayout>
    </AnimatedPage>
  );
}

export default AdminActivityPage;
