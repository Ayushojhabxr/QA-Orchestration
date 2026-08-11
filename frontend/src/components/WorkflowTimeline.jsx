import GlassCard from "./GlassCard";

function WorkflowTimeline({ actions = [] }) {
  const sortedActions = [...actions].sort(
    (left, right) => new Date(right.timestamp) - new Date(left.timestamp)
  );

  return (
    <GlassCard className="p-5">
      <div className="flex items-center justify-between">
        <h3 className="font-display text-xl font-semibold text-white">Timeline</h3>
        <span className="text-xs uppercase tracking-[0.24em] text-slate-500">
          {sortedActions.length} events
        </span>
      </div>
      <div className="mt-5 space-y-4">
        {sortedActions.map((action, index) => (
          <div key={`${action._id || action.timestamp}-${index}`} className="flex gap-4">
            <div className="flex flex-col items-center">
              <div className="h-3 w-3 rounded-full bg-gradient-to-r from-glow to-aurora" />
              {index < sortedActions.length - 1 ? (
                <div className="mt-2 h-full w-px bg-slate-800" />
              ) : null}
            </div>
            <div className="min-w-0 rounded-2xl border border-slate-800 bg-slate-950/40 p-4">
              <p className="text-xs uppercase tracking-[0.2em] text-slate-500">{action.type}</p>
              <p className="mt-2 text-sm font-semibold text-white">{action.userName}</p>
              <p className="mt-1 text-sm text-slate-300">{action.message}</p>
              <p className="mt-2 text-xs text-slate-500">
                {new Date(action.timestamp).toLocaleString()}
              </p>
            </div>
          </div>
        ))}
        {!sortedActions.length ? <p className="text-sm text-slate-400">No workflow events yet.</p> : null}
      </div>
    </GlassCard>
  );
}

export default WorkflowTimeline;
