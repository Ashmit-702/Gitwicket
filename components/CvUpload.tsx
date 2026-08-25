"use client";

import { useCallback, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import type { ParsedCv } from "@/lib/cvParsing";

type Status = "idle" | "dragging" | "uploading" | "success" | "error";

const MAX_MB = 4;

export default function CvUpload({ onParsed }: { onParsed: (cv: ParsedCv | null) => void }) {
  const [status, setStatus] = useState<Status>("idle");
  const [fileName, setFileName] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [parsed, setParsed] = useState<ParsedCv | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const upload = useCallback(
    async (file: File) => {
      setStatus("uploading");
      setError(null);
      setFileName(file.name);

      const form = new FormData();
      form.append("cv", file);

      try {
        const res = await fetch("/api/parse-cv", { method: "POST", body: form });
        const data = await res.json();
        if (!res.ok) {
          setError(data.error || "Something went wrong reading that file.");
          setStatus("error");
          onParsed(null);
          return;
        }
        setParsed(data.parsed);
        setStatus("success");
        onParsed(data.parsed);
      } catch {
        setError("Couldn't reach the server. Check your connection and try again.");
        setStatus("error");
        onParsed(null);
      }
    },
    [onParsed]
  );

  function handleFiles(files: FileList | null) {
    const file = files?.[0];
    if (!file) return;
    if (file.size > MAX_MB * 1024 * 1024) {
      setError(`That file is over ${MAX_MB}MB — try a smaller export.`);
      setStatus("error");
      setFileName(file.name);
      return;
    }
    upload(file);
  }

  function handleRemove() {
    setStatus("idle");
    setFileName(null);
    setParsed(null);
    setError(null);
    onParsed(null);
    if (inputRef.current) inputRef.current.value = "";
  }

  return (
    <div>
      <input
        ref={inputRef}
        type="file"
        accept=".pdf,.docx,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
        className="hidden"
        onChange={(e) => handleFiles(e.target.files)}
      />

      {status === "idle" || status === "dragging" ? (
        <div
          onDragOver={(e) => {
            e.preventDefault();
            setStatus("dragging");
          }}
          onDragLeave={() => setStatus("idle")}
          onDrop={(e) => {
            e.preventDefault();
            setStatus("idle");
            handleFiles(e.dataTransfer.files);
          }}
          onClick={() => inputRef.current?.click()}
          role="button"
          tabIndex={0}
          onKeyDown={(e) => e.key === "Enter" && inputRef.current?.click()}
          className={`flex cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed px-6 py-10 text-center transition ${
            status === "dragging" ? "border-bail bg-bail/5" : "border-chalk/15 hover:border-chalk/30"
          }`}
        >
          <p className="font-display text-sm font-bold uppercase tracking-wide text-chalk/70">Drop your CV here</p>
          <p className="mt-1 font-body text-xs text-chalk/40">or click to browse — PDF or DOCX, up to {MAX_MB}MB</p>
        </div>
      ) : (
        <div className="rounded-xl border border-chalk/10 p-5">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <p className="truncate font-body text-sm text-chalk/80">{fileName}</p>
              {status === "uploading" && <p className="mt-1 font-body text-xs text-chalk/40">Reading your CV…</p>}
              {status === "success" && <p className="mt-1 font-body text-xs text-bail">Parsed successfully.</p>}
              {status === "error" && <p className="mt-1 font-body text-xs text-leather">{error}</p>}
            </div>
            <button
              onClick={handleRemove}
              className="shrink-0 font-display text-xs uppercase tracking-widest text-chalk/40 transition hover:text-leather"
            >
              {status === "error" ? "Try again" : "Remove"}
            </button>
          </div>

          {status === "uploading" && (
            <div className="mt-3 h-1 overflow-hidden rounded-full bg-chalk/10">
              <motion.div
                className="h-full w-1/3 rounded-full bg-bail"
                animate={{ x: ["-100%", "300%"] }}
                transition={{ duration: 1.1, repeat: Infinity, ease: "easeInOut" }}
              />
            </div>
          )}

          <AnimatePresence>
            {status === "success" && parsed && (
              <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} className="mt-4 overflow-hidden border-t border-chalk/10 pt-4">
                <p className="font-display text-[10px] font-semibold uppercase tracking-widest text-chalk/40">Found</p>
                <ul className="mt-2 space-y-1 font-body text-xs text-chalk/60">
                  {parsed.person.name && <li>Name: {parsed.person.name}</li>}
                  <li>
                    {parsed.experience.length} experience {parsed.experience.length === 1 ? "entry" : "entries"}, {parsed.projects.length}{" "}
                    {parsed.projects.length === 1 ? "project" : "projects"}, {parsed.education.length} education {parsed.education.length === 1 ? "entry" : "entries"}
                  </li>
                  <li>{Object.values(parsed.skills).flat().length} skills detected</li>
                </ul>
                <p className="mt-3 font-body text-[11px] italic leading-snug text-chalk/35">{parsed.extractionNote}</p>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      )}

      <p className="mt-3 font-body text-[11px] leading-snug text-chalk/35">
        Your CV is used to build your career profile. It isn&apos;t published publicly unless you choose to share
        specific information. The file itself is never stored — only the details you see above.
      </p>
    </div>
  );
}
