import { motion } from "framer-motion";
import {
  FiActivity,
  FiBarChart2,
  FiClipboard,
  FiCommand,
  FiFolder,
  FiGrid,
  FiHome,
  FiLogOut,
  FiMenu,
  FiShield,
  FiTerminal,
  FiUploadCloud,
  FiUsers,
  FiX,
} from "react-icons/fi";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useState } from "react";
import GlobalSearchPanel from "../components/GlobalSearchPanel";
import GlowButton from "../components/GlowButton";
import NotificationCenter from "../components/NotificationCenter";
import useAuth from "../hooks/useAuth";

const navConfig = {
  admin: [
    { label: "Home", href: "/", icon: FiHome },
    { label: "Analytics", href: "/admin/dashboard", icon: FiBarChart2 },
    { label: "Projects", href: "/admin/projects", icon: FiFolder },
    { label: "Users", href: "/admin/users", icon: FiUsers },
    { label: "Activity", href: "/admin/activity", icon: FiActivity },
  ],
  developer: [
    { label: "Home", href: "/", icon: FiHome },
    { label: "Analytics", href: "/developer/dashboard", icon: FiBarChart2 },
    { label: "Projects", href: "/developer/projects", icon: FiFolder },
  ],
  tester: [
    { label: "Home", href: "/", icon: FiHome },
    { label: "Analytics", href: "/tester/dashboard", icon: FiBarChart2 },
    { label: "Projects", href: "/tester/projects", icon: FiClipboard },
  ],
};

function DashboardLayout({ title, subtitle, children, actions }) {
  const { user, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const roleMeta = {
    admin: { label: "System Admin", icon: FiShield, accent: "from-amber-400 to-orange-400" },
    developer: { label: "Developer Ops", icon: FiTerminal, accent: "from-cyan-400 to-sky-400" },
    tester: { label: "QA Command", icon: FiUploadCloud, accent: "from-emerald-300 to-cyan-300" },
  }[user?.role || "tester"];
  const RoleIcon = roleMeta.icon;

  const Sidebar = (
    <motion.aside
      initial={{ x: -18, opacity: 0 }}
      animate={{ x: 0, opacity: 1 }}
      className="w-full lg:w-80"
    >
      <div className="glass-panel control-grid rounded-[2rem] p-5">
        <div className="flex items-center justify-between lg:block">
          <div>
            <Link to="/" className="font-display text-2xl font-bold text-gradient">
              TestFlow
            </Link>
            <p className="mt-2 text-xs uppercase tracking-[0.28em] text-slate-500">
              Developer Control Center
            </p>
          </div>
          <button
            type="button"
            className="rounded-2xl border border-slate-800 bg-slate-950/40 p-2 text-slate-300 lg:hidden"
            onClick={() => setSidebarOpen(false)}
          >
            <FiX size={18} />
          </button>
        </div>

        <div className="mt-6 rounded-[1.5rem] border border-slate-800 bg-slate-950/60 p-4 neon-border">
          <div className="flex items-center gap-4">
            <div className={`rounded-2xl bg-gradient-to-br p-3 text-slate-950 ${roleMeta.accent}`}>
              <RoleIcon size={22} />
            </div>
            <div>
              <p className="text-xs uppercase tracking-[0.2em] text-slate-500">{roleMeta.label}</p>
              <p className="mt-1 font-semibold text-white">{user?.name}</p>
            </div>
          </div>
          <p className="mt-4 text-sm text-slate-400">{user?.email}</p>
          <div className="mt-4 flex items-center gap-3 text-xs uppercase tracking-[0.2em] text-slate-500">
            <span className="radar-dot h-2.5 w-2.5 rounded-full bg-glow" />
            <span>Secure Session Active</span>
          </div>
        </div>

        <nav className="mt-6 space-y-2">
          {navConfig[user?.role || "tester"].map((item) => {
            const ItemIcon = item.icon;
            const active =
              location.pathname === item.href ||
              (item.href !== "/" && location.pathname.startsWith(`${item.href}/`));

            return (
              <Link
                key={item.href}
                to={item.href}
                className={`flex items-center gap-3 rounded-2xl px-4 py-3 text-sm font-semibold transition ${
                  active
                    ? "bg-white text-slate-950 shadow-[0_0_24px_rgba(255,255,255,0.12)]"
                    : "border border-slate-800 bg-slate-950/35 text-slate-300 hover:border-glow hover:bg-slate-900/70 hover:text-glow"
                }`}
                onClick={() => setSidebarOpen(false)}
              >
                <ItemIcon size={18} />
                <span>{item.label}</span>
              </Link>
            );
          })}
        </nav>

        <div className="mt-6 grid gap-3 sm:grid-cols-3 lg:grid-cols-1">
          {[
            { label: "Monitoring", icon: FiActivity },
            { label: "Projects", icon: FiFolder },
            { label: "Users", icon: FiUsers },
          ].map((entry) => {
            const Icon = entry.icon;
            return (
              <div
                key={entry.label}
                className="rounded-2xl border border-slate-800 bg-slate-950/40 px-4 py-3 text-sm text-slate-300"
              >
                <div className="flex items-center gap-3">
                  <Icon className="text-glow" size={16} />
                  <span>{entry.label}</span>
                </div>
              </div>
            );
          })}
        </div>

        <GlowButton
          type="button"
          variant="ghost"
          className="mt-6 w-full justify-center"
          onClick={async () => {
            await logout();
            navigate("/login");
          }}
        >
          <span className="inline-flex items-center gap-2">
            <FiLogOut size={16} />
            Sign Out
          </span>
        </GlowButton>
      </div>
    </motion.aside>
  );

  return (
    <div className="min-h-screen px-4 py-6 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-[1540px]">
        <div className="glass-panel control-grid rounded-[2rem] p-4 sm:p-6">
          <div className="mb-4 flex items-center justify-between lg:hidden">
            <button
              type="button"
              className="rounded-2xl border border-slate-800 bg-slate-950/50 p-3 text-slate-100"
              onClick={() => setSidebarOpen((current) => !current)}
            >
              {sidebarOpen ? <FiX size={18} /> : <FiMenu size={18} />}
            </button>
            <div className="flex items-center gap-3 text-sm text-slate-300">
              <FiCommand className="text-glow" size={18} />
              <span>Control Center</span>
            </div>
          </div>

          <div className="flex flex-col gap-6 lg:flex-row">
            <div className="hidden lg:block">{Sidebar}</div>
            {sidebarOpen ? <div className="lg:hidden">{Sidebar}</div> : null}

            <main className="min-w-0 flex-1">
              <div className="glass-panel control-grid flex flex-col gap-4 rounded-[1.9rem] border border-slate-800 p-6">
                <div className="flex flex-col gap-4 xl:flex-row xl:items-end xl:justify-between">
                  <div>
                    <p className="text-xs uppercase tracking-[0.32em] text-slate-500">Control Center</p>
                    <h1 className="mt-3 font-display text-4xl font-bold text-white md:text-5xl">
                      {title}
                    </h1>
                    <p className="mt-3 max-w-3xl text-sm leading-6 text-slate-400">{subtitle}</p>
                  </div>
                  <div className="flex flex-col gap-3 xl:items-end">
                    <div className="flex w-full flex-col gap-3 lg:flex-row lg:items-center xl:w-auto">
                      <GlobalSearchPanel />
                      <NotificationCenter />
                    </div>
                    <div className="flex flex-wrap items-center gap-3">
                    <div className="inline-flex items-center gap-2 rounded-full border border-slate-800 bg-slate-950/50 px-4 py-2 text-xs uppercase tracking-[0.24em] text-slate-400">
                      <FiGrid className="text-glow" size={14} />
                      Neural Ops
                    </div>
                    {actions ? <div className="flex flex-wrap gap-3">{actions}</div> : null}
                    </div>
                  </div>
                </div>
                {children}
              </div>
            </main>
          </div>
        </div>
      </div>
    </div>
  );
}

export default DashboardLayout;
