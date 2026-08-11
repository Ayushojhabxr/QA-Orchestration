import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import GlassCard from "./GlassCard";

const chartColors = ["#5eead4", "#38bdf8", "#f97316", "#a78bfa", "#f43f5e"];

function ChartCard({ title, subtitle, type = "bar", data = [], dataKey, nameKey = "name" }) {
  return (
    <GlassCard className="p-5">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-xs uppercase tracking-[0.24em] text-slate-500">Analytics</p>
          <h3 className="mt-2 font-display text-xl font-semibold text-white">{title}</h3>
          <p className="mt-1 text-sm text-slate-400">{subtitle}</p>
        </div>
        <div className="radar-dot mt-2 h-3 w-3 rounded-full bg-glow" />
      </div>
      <div className="mt-5 h-72 rounded-3xl border border-slate-800 bg-slate-950/35 p-3">
        <ResponsiveContainer width="100%" height="100%">
          {type === "pie" ? (
            <PieChart>
              <Tooltip
                contentStyle={{
                  background: "rgba(4, 8, 20, 0.95)",
                  border: "1px solid rgba(56, 189, 248, 0.2)",
                  borderRadius: "18px",
                }}
              />
              <Pie
                data={data}
                dataKey={dataKey}
                nameKey={nameKey}
                innerRadius={58}
                outerRadius={95}
                paddingAngle={4}
              >
                {data.map((entry, index) => (
                  <Cell key={`${entry[nameKey]}-${index}`} fill={chartColors[index % chartColors.length]} />
                ))}
              </Pie>
            </PieChart>
          ) : (
            <BarChart data={data}>
              <CartesianGrid stroke="rgba(148,163,184,0.12)" vertical={false} />
              <XAxis
                dataKey={nameKey}
                tick={{ fill: "#94a3b8", fontSize: 12 }}
                axisLine={false}
                tickLine={false}
              />
              <YAxis tick={{ fill: "#94a3b8", fontSize: 12 }} axisLine={false} tickLine={false} />
              <Tooltip
                contentStyle={{
                  background: "rgba(4, 8, 20, 0.95)",
                  border: "1px solid rgba(56, 189, 248, 0.2)",
                  borderRadius: "18px",
                }}
              />
              <Bar dataKey={dataKey} radius={[12, 12, 4, 4]}>
                {data.map((entry, index) => (
                  <Cell key={`${entry[nameKey]}-${index}`} fill={chartColors[index % chartColors.length]} />
                ))}
              </Bar>
            </BarChart>
          )}
        </ResponsiveContainer>
      </div>
    </GlassCard>
  );
}

export default ChartCard;
