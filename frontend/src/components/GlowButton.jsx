function GlowButton({ children, className = "", variant = "primary", ...props }) {
  const variants = {
    primary:
      "border border-cyan-300/20 bg-gradient-to-r from-glow via-aurora to-flare text-slate-950 shadow-[0_0_32px_rgba(94,234,212,0.25)] hover:-translate-y-0.5 hover:shadow-[0_0_48px_rgba(56,189,248,0.22)]",
    ghost:
      "border border-cyan-400/15 bg-slate-950/55 text-slate-100 hover:border-glow hover:bg-slate-900/80 hover:text-glow",
    danger:
      "border border-red-400/40 bg-red-500/10 text-red-200 hover:-translate-y-0.5 hover:bg-red-500/20",
  };

  return (
    <button
      className={`inline-flex items-center justify-center rounded-2xl px-4 py-2 text-sm font-semibold transition-all duration-300 disabled:cursor-not-allowed disabled:opacity-50 ${variants[variant]} ${className}`}
      {...props}
    >
      {children}
    </button>
  );
}

export default GlowButton;
