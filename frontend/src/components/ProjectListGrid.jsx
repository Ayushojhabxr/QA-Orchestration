import { Link } from "react-router-dom";
import GlassCard from "./GlassCard";

function ProjectListGrid({ projects = [], basePath, emptyMessage = "No projects available." }) {
  return (
    <div className="grid gap-4 lg:grid-cols-2 2xl:grid-cols-3">
      {projects.map((project) => (
        <GlassCard key={project._id} className="p-6">
          <p className="text-xs uppercase tracking-[0.22em] text-slate-500">Project</p>
          <h3 className="mt-3 font-display text-2xl font-semibold text-white">{project.name}</h3>
          <p className="mt-3 text-sm text-slate-400">{project.description || "No description provided."}</p>
          <div className="mt-5 flex flex-wrap gap-2 text-xs uppercase tracking-[0.18em] text-slate-500">
            <span>{(project.testers || []).length} testers</span>
            <span>/</span>
            <span>{(project.developers || []).length} developers</span>
          </div>
          <Link
            to={`${basePath}/${project._id}`}
            className="mt-6 inline-flex rounded-2xl border border-glow/40 bg-glow/10 px-4 py-3 text-sm font-semibold text-glow transition hover:border-glow hover:bg-glow/20"
          >
            Open Project
          </Link>
        </GlassCard>
      ))}
      {!projects.length ? (
        <GlassCard className="p-8 text-center text-slate-400">{emptyMessage}</GlassCard>
      ) : null}
    </div>
  );
}

export default ProjectListGrid;
