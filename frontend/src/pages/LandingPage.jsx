import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import AnimatedPage from "../components/AnimatedPage";
import GlassCard from "../components/GlassCard";
import GlowButton from "../components/GlowButton";
import useAuth from "../hooks/useAuth";

function LandingPage() {
  const { user, isAuthenticated, getDashboardPath } = useAuth();

  return (
    <AnimatedPage className="px-4 py-8 sm:px-6 lg:px-8">
      <div className="mx-auto grid min-h-[calc(100vh-4rem)] max-w-7xl items-center gap-8 lg:grid-cols-[1.15fr_0.85fr]">
        <div>
          <motion.p
            initial={{ opacity: 0, x: -12 }}
            animate={{ opacity: 1, x: 0 }}
            className="text-sm uppercase tracking-[0.35em] text-glow"
          >
            Full Stack QA Orchestration
          </motion.p>
          <motion.h1
            initial={{ opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.08 }}
            className="mt-6 max-w-3xl font-display text-5xl font-bold leading-tight text-white md:text-7xl"
          >
            Ship bugs through a <span className="text-gradient">faster signal loop</span>.
          </motion.h1>
          <motion.p
            initial={{ opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.16 }}
            className="mt-6 max-w-2xl text-lg text-slate-300"
          >
            TestFlow combines multi-sheet Excel ingestion, role-aware dashboards, assignment workflows,
            and export back to workbook structure from one dark, futuristic workspace.
          </motion.p>
          <div className="mt-8 flex flex-wrap gap-4">
            {isAuthenticated ? (
              <Link to={getDashboardPath(user?.role)}>
                <GlowButton>Open Dashboard</GlowButton>
              </Link>
            ) : (
              <>
                <Link to="/register">
                  <GlowButton>Launch TestFlow</GlowButton>
                </Link>
                <Link to="/login">
                  <GlowButton variant="ghost">Sign In</GlowButton>
                </Link>
              </>
            )}
          </div>
        </div>

        <div className="grid gap-4">
          {[
            "Multi-sheet Excel upload with live preview",
            "Role-based admin, developer, tester control centers",
            "Dynamic tables with assignment and status sync",
          ].map((item, index) => (
            <GlassCard key={item} className="p-5">
              <p className="text-xs uppercase tracking-[0.25em] text-slate-500">Node 0{index + 1}</p>
              <p className="mt-3 font-display text-2xl font-semibold text-white">{item}</p>
            </GlassCard>
          ))}
        </div>
      </div>
    </AnimatedPage>
  );
}

export default LandingPage;
