import { useState } from "react";
import GlassCard from "./GlassCard";
import GlowButton from "./GlowButton";

function ProjectManager({
  projects,
  testers = [],
  developers = [],
  onCreate,
  onUpdate,
  onDelete,
}) {
  const [form, setForm] = useState({ name: "", description: "", testers: [], developers: [] });
  const [editingProjectId, setEditingProjectId] = useState("");

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (!form.name) return;
    if (editingProjectId) {
      await onUpdate(editingProjectId, form);
      setEditingProjectId("");
    } else {
      await onCreate(form);
    }
    setForm({ name: "", description: "", testers: [], developers: [] });
  };

  return (
    <div className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
      <GlassCard className="p-6">
        <p className="font-display text-xl font-semibold text-white">Create Project</p>
        <form className="mt-4 space-y-4" onSubmit={handleSubmit}>
          <input
            value={form.name}
            onChange={(event) => setForm((current) => ({ ...current, name: event.target.value }))}
            placeholder="Project name"
            className="w-full rounded-2xl border border-slate-700 bg-slate-950/60 px-4 py-3 text-slate-100 outline-none"
          />
          <textarea
            value={form.description}
            onChange={(event) =>
              setForm((current) => ({ ...current, description: event.target.value }))
            }
            placeholder="Project description"
            rows="4"
            className="w-full rounded-2xl border border-slate-700 bg-slate-950/60 px-4 py-3 text-slate-100 outline-none"
          />
          <div className="grid gap-4 lg:grid-cols-2">
            <div>
              <p className="mb-2 text-xs uppercase tracking-[0.18em] text-slate-500">Assign Testers</p>
              <select
                multiple
                value={form.testers}
                onChange={(event) =>
                  setForm((current) => ({
                    ...current,
                    testers: [...event.target.selectedOptions].map((option) => option.value),
                  }))
                }
                className="min-h-32 w-full rounded-2xl border border-slate-700 bg-slate-950/60 px-4 py-3 text-slate-100 outline-none"
              >
                {testers.map((user) => (
                  <option key={user._id} value={user._id}>
                    {user.name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <p className="mb-2 text-xs uppercase tracking-[0.18em] text-slate-500">Assign Developers</p>
              <select
                multiple
                value={form.developers}
                onChange={(event) =>
                  setForm((current) => ({
                    ...current,
                    developers: [...event.target.selectedOptions].map((option) => option.value),
                  }))
                }
                className="min-h-32 w-full rounded-2xl border border-slate-700 bg-slate-950/60 px-4 py-3 text-slate-100 outline-none"
              >
                {developers.map((user) => (
                  <option key={user._id} value={user._id}>
                    {user.name}
                  </option>
                ))}
              </select>
            </div>
          </div>
          <GlowButton type="submit">{editingProjectId ? "Update Project" : "Create Project"}</GlowButton>
        </form>
      </GlassCard>

      <GlassCard className="p-6">
        <p className="font-display text-xl font-semibold text-white">Active Projects</p>
        <div className="mt-4 space-y-3">
          {projects.map((project) => (
            <div
              key={project._id}
              className="flex items-start justify-between rounded-2xl border border-slate-800 bg-slate-950/50 p-4"
            >
              <div>
                <p className="font-semibold text-white">{project.name}</p>
                <p className="mt-1 text-sm text-slate-400">{project.description || "No description"}</p>
                <p className="mt-2 text-xs uppercase tracking-[0.18em] text-slate-500">
                  {(project.testers || []).length} testers / {(project.developers || []).length} developers
                </p>
              </div>
              <div className="flex gap-2">
                <GlowButton
                  type="button"
                  variant="ghost"
                  onClick={() => {
                    setEditingProjectId(project._id);
                    setForm({
                      name: project.name,
                      description: project.description || "",
                      testers: (project.testers || []).map((member) => member._id || member),
                      developers: (project.developers || []).map((member) => member._id || member),
                    });
                  }}
                >
                  Edit
                </GlowButton>
                <GlowButton type="button" variant="danger" onClick={() => onDelete(project._id)}>
                  Delete
                </GlowButton>
              </div>
            </div>
          ))}
          {!projects.length ? <p className="text-sm text-slate-400">No projects created yet.</p> : null}
        </div>
      </GlassCard>
    </div>
  );
}

export default ProjectManager;
