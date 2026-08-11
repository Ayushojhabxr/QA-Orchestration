function GlassCard({ children, className = "" }) {
  return <div className={`glass-panel control-grid rounded-3xl ${className}`}>{children}</div>;
}

export default GlassCard;
