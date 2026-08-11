import { Link } from "react-router-dom";
import GlassCard from "./GlassCard";

function ProjectCaseTable({ rows = [], baseDetailPath }) {
  return (
    <GlassCard className="overflow-hidden">
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-slate-800">
          <thead className="bg-slate-950/60">
            <tr>
              {["Scenario", "Project", "Sheet", "Priority", "Status", "Tester", "Developer", "Open"].map(
                (header) => (
                  <th
                    key={header}
                    className="px-4 py-4 text-left text-xs uppercase tracking-[0.22em] text-slate-400"
                  >
                    {header}
                  </th>
                )
              )}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-900/80">
            {rows.map((row) => (
              <tr key={row._id} className="hover:bg-slate-900/20">
                <td className="px-4 py-4 text-white">{row.scenarioId}</td>
                <td className="px-4 py-4 text-slate-300">{row.project?.name || "-"}</td>
                <td className="px-4 py-4 text-slate-300">{row.sheetName}</td>
                <td className="px-4 py-4 text-slate-300">{row.priority}</td>
                <td className="px-4 py-4 text-slate-300">{row.status}</td>
                <td className="px-4 py-4 text-slate-300">{row.testerName}</td>
                <td className="px-4 py-4 text-slate-300">{row.assignedToDeveloperName || "-"}</td>
                <td className="px-4 py-4">
                  <Link
                    to={`${baseDetailPath}/${row._id}`}
                    className="inline-flex rounded-xl border border-glow/40 bg-glow/10 px-3 py-2 text-sm text-glow"
                  >
                    Details
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {!rows.length ? <div className="p-6 text-sm text-slate-400">No test cases in this view.</div> : null}
    </GlassCard>
  );
}

export default ProjectCaseTable;
