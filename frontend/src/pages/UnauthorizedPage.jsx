import { Link } from "react-router-dom";
import AnimatedPage from "../components/AnimatedPage";
import GlassCard from "../components/GlassCard";
import GlowButton from "../components/GlowButton";

function UnauthorizedPage() {
  return (
    <AnimatedPage className="flex min-h-screen items-center justify-center px-4">
      <GlassCard className="max-w-lg p-8 text-center">
        <p className="text-sm uppercase tracking-[0.3em] text-flare">Access Denied</p>
        <h1 className="mt-4 font-display text-4xl font-bold text-white">Role mismatch</h1>
        <p className="mt-4 text-slate-300">
          Your account is authenticated, but it does not have permission to open this dashboard.
        </p>
        <Link to="/" className="mt-8 inline-block">
          <GlowButton>Back to Home</GlowButton>
        </Link>
      </GlassCard>
    </AnimatedPage>
  );
}

export default UnauthorizedPage;
