function LoadingScreen() {
  return (
    <div className="flex min-h-screen items-center justify-center px-4">
      <div className="glass-panel control-grid w-full max-w-md rounded-[2rem] p-6">
        <div className="flex items-center gap-4">
          <div className="radar-dot h-4 w-4 rounded-full bg-glow" />
          <div>
            <p className="text-xs uppercase tracking-[0.28em] text-slate-500">Boot Sequence</p>
            <p className="mt-2 font-display text-2xl font-semibold text-white">Loading TestFlow</p>
          </div>
        </div>
        <div className="mt-6 h-2 overflow-hidden rounded-full bg-slate-950/80">
          <div className="h-full w-2/3 rounded-full bg-gradient-to-r from-glow via-aurora to-flare" />
        </div>
      </div>
    </div>
  );
}

export default LoadingScreen;
