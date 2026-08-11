import { useEffect, useRef, useState } from "react";
import * as XLSX from "xlsx";
import GlassCard from "./GlassCard";
import GlowButton from "./GlowButton";

function DropzoneUpload({ onUpload, projects = [], lockedProject = "" }) {
  const inputRef = useRef(null);
  const [dragging, setDragging] = useState(false);
  const [selectedFile, setSelectedFile] = useState(null);
  const [sheetPreview, setSheetPreview] = useState([]);
  const [project, setProject] = useState(lockedProject);
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    if (lockedProject) {
      setProject(lockedProject);
    }
  }, [lockedProject]);

  const loadPreview = async (file) => {
    const buffer = await file.arrayBuffer();
    const workbook = XLSX.read(buffer, { type: "array" });
    const preview = workbook.SheetNames.map((sheetName) => {
      const worksheet = workbook.Sheets[sheetName];
      const rows = XLSX.utils.sheet_to_json(worksheet, { defval: "" });
      return {
        sheetName,
        rowCount: rows.length,
        headers: rows[0] ? Object.keys(rows[0]) : [],
      };
    });

    setSelectedFile(file);
    setSheetPreview(preview);
  };

  const handleFile = async (file) => {
    if (!file || !file.name.toLowerCase().endsWith(".xlsx")) return;
    await loadPreview(file);
  };

  const handleUpload = async () => {
    if (!selectedFile) return;
    setProgress(0);
    await onUpload({
      file: selectedFile,
      project,
      onUploadProgress: (event) => {
        if (!event.total) return;
        setProgress(Math.round((event.loaded / event.total) * 100));
      },
    });
    setProgress(100);
  };

  return (
    <GlassCard className="p-6">
      <div
        className={`grid-overlay rounded-3xl border border-dashed p-8 text-center transition-all ${
          dragging ? "border-glow bg-glow/10" : "border-slate-700 bg-slate-950/20"
        }`}
        onDragEnter={(event) => {
          event.preventDefault();
          setDragging(true);
        }}
        onDragOver={(event) => {
          event.preventDefault();
          setDragging(true);
        }}
        onDragLeave={(event) => {
          event.preventDefault();
          setDragging(false);
        }}
        onDrop={async (event) => {
          event.preventDefault();
          setDragging(false);
          const file = event.dataTransfer.files?.[0];
          await handleFile(file);
        }}
      >
        <p className="font-display text-xl font-semibold text-white">Drop Excel Workbook</p>
        <p className="mt-2 text-sm text-slate-400">
          Multi-sheet `.xlsx` uploads are parsed sheet by sheet and saved to MongoDB.
        </p>
        <p className="mt-2 text-xs uppercase tracking-[0.2em] text-slate-500">
          Select the target project before upload.
        </p>
        <div className="mt-5 flex flex-wrap items-center justify-center gap-3">
          <GlowButton type="button" onClick={() => inputRef.current?.click()}>
            Choose File
          </GlowButton>
          <select
            value={project}
            onChange={(event) => setProject(event.target.value)}
            disabled={Boolean(lockedProject)}
            className="rounded-2xl border border-slate-700 bg-slate-900/70 px-4 py-2 text-sm text-slate-100 outline-none"
          >
            <option value="">Select project</option>
            {projects.map((item) => (
              <option key={item._id} value={item._id}>
                {item.name}
              </option>
            ))}
          </select>
          <GlowButton
            type="button"
            variant="ghost"
            onClick={handleUpload}
            disabled={!selectedFile || !project}
          >
            Upload Workbook
          </GlowButton>
        </div>
        <input
          ref={inputRef}
          type="file"
          accept=".xlsx"
          className="hidden"
          onChange={async (event) => {
            const file = event.target.files?.[0];
            await handleFile(file);
          }}
        />
      </div>

      {selectedFile ? (
        <div className="mt-5 space-y-4">
          <div className="flex items-center justify-between text-sm text-slate-300">
            <span>{selectedFile.name}</span>
            <span>{progress > 0 ? `${progress}% uploaded` : "Ready to upload"}</span>
          </div>
          <div className="h-2 overflow-hidden rounded-full bg-slate-900">
            <div
              className="h-full rounded-full bg-gradient-to-r from-glow to-aurora transition-all"
              style={{ width: `${progress}%` }}
            />
          </div>
          <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
            {sheetPreview.map((sheet) => (
              <div key={sheet.sheetName} className="rounded-2xl border border-slate-800 bg-slate-950/40 p-4">
                <p className="font-semibold text-white">{sheet.sheetName}</p>
                <p className="mt-1 text-sm text-slate-400">{sheet.rowCount} rows detected</p>
                <p className="mt-2 text-xs text-slate-500">{sheet.headers.join(" | ") || "No headers"}</p>
              </div>
            ))}
          </div>
        </div>
      ) : null}
    </GlassCard>
  );
}

export default DropzoneUpload;
