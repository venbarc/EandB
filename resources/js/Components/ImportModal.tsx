import React, { useRef } from 'react';
import { useForm } from '@inertiajs/react';
import { Upload, X, FileText, Loader2, CheckCircle2, AlertTriangle, SkipForward } from 'lucide-react';
import { ImportResult } from '@/types';

interface ImportModalProps {
  isOpen: boolean;
  onClose: () => void;
  importResult?: ImportResult | null;
}

export const ImportModal: React.FC<ImportModalProps> = ({ isOpen, onClose, importResult }) => {
  const fileRef = useRef<HTMLInputElement>(null);
  const { data, setData, post, processing, errors, reset } = useForm<{ file: File | null }>({ file: null });

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setData('file', e.target.files?.[0] ?? null);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    post('/appointments/import', { forceFormData: true });
  };

  const handleClose = () => {
    reset();
    if (fileRef.current) fileRef.current.value = '';
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={handleClose} />

      <div className="relative w-full max-w-md rounded-2xl border border-white/10 bg-slate-900 p-6 shadow-2xl">
        {/* Header */}
        <div className="mb-5 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="rounded-lg bg-cyan-500/15 p-2 text-cyan-400">
              <Upload size={17} />
            </div>
            <h2 className="text-base font-semibold text-white">Import CSV / Excel</h2>
          </div>
          <button
            onClick={handleClose}
            className="rounded-lg p-1.5 text-slate-400 transition hover:bg-white/10 hover:text-white"
          >
            <X size={17} />
          </button>
        </div>

        {/* Import result summary (shown after a successful import) */}
        {importResult && (
          <div className="mb-5 space-y-3">
            <div className="flex items-center gap-2 rounded-xl border border-emerald-400/25 bg-emerald-500/10 px-4 py-3">
              <CheckCircle2 size={16} className="shrink-0 text-emerald-400" />
              <span className="text-sm font-medium text-emerald-200">
                {importResult.imported} record{importResult.imported !== 1 ? 's' : ''} imported successfully.
              </span>
            </div>

            {importResult.skipped > 0 && (
              <div className="rounded-xl border border-amber-400/25 bg-amber-500/10 px-4 py-3">
                <div className="flex items-center gap-2">
                  <SkipForward size={16} className="shrink-0 text-amber-400" />
                  <span className="text-sm font-medium text-amber-200">
                    {importResult.skipped} duplicate{importResult.skipped !== 1 ? 's' : ''} skipped.
                  </span>
                </div>

                {/* Duplicate detail list */}
                <ul className="mt-3 max-h-44 space-y-1.5 overflow-y-auto pr-1">
                  {importResult.duplicates.map((dup, i) => (
                    <li
                      key={i}
                      className="rounded-lg border border-white/5 bg-slate-800/60 px-3 py-2 text-xs text-slate-300"
                    >
                      <span className="font-medium text-white">{dup.patient_name}</span>
                      <span className="mx-1.5 text-slate-500">·</span>
                      {dup.date_of_service}
                      {dup.patient_dob && (
                        <>
                          <span className="mx-1.5 text-slate-500">·</span>
                          <span className="text-slate-400">DOB: {dup.patient_dob}</span>
                        </>
                      )}
                      {dup.invoice_no && (
                        <>
                          <span className="mx-1.5 text-slate-500">·</span>
                          <span className="font-mono text-slate-400">#{dup.invoice_no}</span>
                        </>
                      )}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Upload another */}
            <button
              onClick={() => { reset(); if (fileRef.current) fileRef.current.value = ''; }}
              className="w-full rounded-xl border border-white/10 py-2 text-sm font-medium text-slate-300 transition hover:bg-white/5 hover:text-white"
            >
              Upload another file
            </button>
          </div>
        )}

        {/* Upload form (hidden when showing result) */}
        {!importResult && (
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Drop zone */}
            <div
              className="flex cursor-pointer flex-col items-center gap-3 rounded-xl border-2 border-dashed border-white/15 p-6 text-center transition hover:border-cyan-400/50 hover:bg-white/5"
              onClick={() => fileRef.current?.click()}
            >
              {data.file ? (
                <>
                  <FileText size={28} className="text-cyan-400" />
                  <span className="text-sm font-medium text-white">{data.file.name}</span>
                  <span className="text-xs text-slate-400">{(data.file.size / 1024).toFixed(1)} KB</span>
                </>
              ) : (
                <>
                  <Upload size={28} className="text-slate-400" />
                  <span className="text-sm text-slate-300">Click to browse or drop a file here</span>
                  <span className="text-xs text-slate-500">.xlsx · .xls · .csv — max 20 MB</span>
                </>
              )}
              <input
                ref={fileRef}
                type="file"
                accept=".xlsx,.xls,.csv"
                className="hidden"
                onChange={handleFileChange}
              />
            </div>

            {errors.file && (
              <div className="flex items-center gap-2 rounded-lg border border-rose-400/25 bg-rose-500/10 px-3 py-2">
                <AlertTriangle size={14} className="shrink-0 text-rose-400" />
                <p className="text-sm text-rose-300">{errors.file}</p>
              </div>
            )}

            <div className="flex gap-2.5">
              <button
                type="button"
                onClick={handleClose}
                className="flex-1 rounded-xl border border-white/10 py-2.5 text-sm font-medium text-slate-300 transition hover:bg-white/5 hover:text-white"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={!data.file || processing}
                className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 px-4 py-2.5 text-sm font-semibold text-white shadow-md transition hover:from-cyan-400 hover:to-blue-500 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {processing ? (
                  <>
                    <Loader2 size={14} className="animate-spin" />
                    Importing…
                  </>
                ) : (
                  <>
                    <Upload size={14} />
                    Import
                  </>
                )}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};
