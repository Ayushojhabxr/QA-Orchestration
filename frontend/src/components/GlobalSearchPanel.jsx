import { startTransition, useDeferredValue, useEffect, useState } from "react";
import { FiSearch } from "react-icons/fi";
import { searchGlobal } from "../services/systemService";

function GlobalSearchPanel() {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState([]);
  const deferredQuery = useDeferredValue(query);

  useEffect(() => {
    if (!deferredQuery.trim()) {
      setResults([]);
      return;
    }

    const timeout = setTimeout(async () => {
      const data = await searchGlobal(deferredQuery.trim());
      startTransition(() => {
        setResults(data.items || []);
      });
    }, 180);

    return () => clearTimeout(timeout);
  }, [deferredQuery]);

  return (
    <div className="relative min-w-[280px] flex-1 xl:max-w-xl">
      <div className="flex items-center gap-3 rounded-2xl border border-slate-800 bg-slate-950/55 px-4 py-3">
        <FiSearch className="text-glow" size={18} />
        <input
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Search scenario, tester, developer, or sheet..."
          className="w-full bg-transparent text-sm text-slate-100 outline-none placeholder:text-slate-500"
        />
      </div>

      {query.trim() ? (
        <div className="absolute left-0 right-0 z-30 mt-3 rounded-[1.6rem] border border-slate-800 bg-slate-950/96 p-4 shadow-2xl shadow-cyan-950/40 backdrop-blur-xl">
          <p className="text-xs uppercase tracking-[0.22em] text-slate-500">Global Search</p>
          <div className="mt-3 space-y-3">
            {results.map((item) => (
              <div key={item._id} className="rounded-2xl border border-slate-800 bg-slate-950/45 p-4">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <p className="font-semibold text-white">{item.scenarioId}</p>
                  <span className="rounded-full border border-slate-700 px-3 py-1 text-xs text-slate-300">
                    {item.priority} / {item.status}
                  </span>
                </div>
                <p className="mt-2 text-sm text-slate-300">{item.description}</p>
                <p className="mt-3 text-xs uppercase tracking-[0.18em] text-slate-500">
                  {item.sheetName} / {item.testerName} / {item.assignedToDeveloperName || "Unassigned"}
                </p>
              </div>
            ))}
            {!results.length ? <p className="text-sm text-slate-400">No matching records.</p> : null}
          </div>
        </div>
      ) : null}
    </div>
  );
}

export default GlobalSearchPanel;
