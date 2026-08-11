import GlassCard from "./GlassCard";

function StatCard({ label, value, accent }) {
  return (
    <GlassCard className="group p-5 transition duration-300 hover:-translate-y-1 hover:shadow-[0_28px_90px_rgba(8,15,28,0.62)]">
      <p className="text-sm uppercase tracking-[0.25em] text-slate-400">{label}</p>
      <div className="mt-3 flex items-end justify-between">
        <p className="font-display text-4xl font-bold text-white">{value}</p>
        <div
          className="h-12 w-12 rounded-2xl transition duration-300 group-hover:scale-110"
          style={{
            background: `radial-gradient(circle, ${accent} 0%, transparent 70%)`,
          }}
        />
      </div>
      <div className="mt-4 h-px bg-gradient-to-r from-transparent via-cyan-300/30 to-transparent" />
    </GlassCard>
  );
}

export default StatCard;
