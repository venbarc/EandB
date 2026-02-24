import React, { useRef } from 'react';
import { useForm } from '@inertiajs/react';
import { Upload, X, FileText, Loader2, AlertTriangle } from 'lucide-react';
import { ImportResult } from '@/types';

interface ImportModalProps {
  isOpen: boolean;
  onClose: () => void;
  importResult?: ImportResult | null;
  onImportStarted?: () => void;
}

export const ImportModal: React.FC<ImportModalProps> = ({ isOpen, onClose, onImportStarted }) => {
  const fileRef = useRef<HTMLInputElement>(null);
  const { data, setData, post, processing, errors, reset } = useForm<{ file: File | null }>({ file: null });

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setData('file', e.target.files?.[0] ?? null);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    post('/appointments/import', {
      forceFormData: true,
      onSuccess: () => {
        reset();
        if (fileRef.current) fileRef.current.value = '';
        onClose();
        onImportStarted?.();
      },
    });
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

      <div className="relative w-full max-w-md rounded-2xl border border-slate-200 bg-white p-6 shadow-2xl">
        {/* Header */}
        <div className="mb-5 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="rounded-lg bg-violet-100 p-2 text-violet-500">
              <Upload size={17} />
            </div>
            <h2 className="text-base font-semibold text-slate-800">Import CSV / Excel</h2>
          </div>
          <button
            onClick={handleClose}
            className="rounded-lg p-1.5 text-slate-400 transition hover:bg-slate-100 hover:text-slate-700"
          >
            <X size={17} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Drop zone */}
          <div
            className="flex cursor-pointer flex-col items-center gap-3 rounded-xl border-2 border-dashed border-slate-200 p-6 text-center transition hover:border-violet-400 hover:bg-violet-50/30"
            onClick={() => fileRef.current?.click()}
          >
            {data.file ? (
              <>
                <FileText size={28} className="text-violet-500" />
                <span className="text-sm font-medium text-slate-800">{data.file.name}</span>
                <span className="text-xs text-slate-500">{(data.file.size / 1024).toFixed(1)} KB</span>
              </>
            ) : (
              <>
                <Upload size={28} className="text-slate-400" />
                <span className="text-sm text-slate-600">Click to browse or drop a file here</span>
                <span className="text-xs text-slate-500">.xlsx · .xls · .csv — max 50 MB</span>
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

          <p className="text-xs text-slate-500">
            Large files are processed in the background — a progress indicator will appear in the bottom-left corner.
          </p>

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
              className="flex-1 rounded-xl border border-slate-200 py-2.5 text-sm font-medium text-slate-600 transition hover:bg-slate-50 hover:text-slate-800"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={!data.file || processing}
              className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-violet-500 to-purple-600 px-4 py-2.5 text-sm font-semibold text-white shadow-md transition hover:from-violet-400 hover:to-purple-500 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {processing ? (
                <>
                  <Loader2 size={14} className="animate-spin" />
                  Uploading…
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
      </div>
    </div>
  );
};
