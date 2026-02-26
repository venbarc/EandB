import React, { useRef, useState } from 'react';
import { Upload, X, FileText, Loader2, AlertTriangle, CheckCircle, RefreshCw, ArrowLeft, ShieldCheck, ShieldAlert, ShieldQuestion } from 'lucide-react';
import { ImportPreviewRecord, ImportPreviewResult, ImportResult } from '@/types';

interface ImportModalProps {
  isOpen: boolean;
  onClose: () => void;
  importResult?: ImportResult | null;
  onImportStarted?: () => void;
}

type ModalStep = 'upload' | 'preview' | 'confirming';

export const ImportModal: React.FC<ImportModalProps> = ({ isOpen, onClose, onImportStarted }) => {
  const fileRef = useRef<HTMLInputElement>(null);
  const [file, setFile] = useState<File | null>(null);
  const [step, setStep] = useState<ModalStep>('upload');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [preview, setPreview] = useState<ImportPreviewResult | null>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFile(e.target.files?.[0] ?? null);
    setError(null);
  };

  const handlePreview = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file) return;

    setLoading(true);
    setError(null);

    try {
      const formData = new FormData();
      formData.append('file', file);

      const csrfToken = document.querySelector<HTMLMetaElement>('meta[name="csrf-token"]')?.content;
      const res = await fetch('/appointments/import-preview', {
        method: 'POST',
        headers: {
          'X-CSRF-TOKEN': csrfToken || '',
          'Accept': 'application/json',
        },
        credentials: 'same-origin',
        body: formData,
      });

      if (!res.ok) {
        const data = await res.json().catch(() => null);
        throw new Error(data?.message || `Preview failed (${res.status})`);
      }

      const data: ImportPreviewResult = await res.json();
      setPreview(data);
      setStep('preview');
    } catch (err: any) {
      setError(err.message || 'Failed to preview file.');
    } finally {
      setLoading(false);
    }
  };

  const handleConfirm = async (mode: 'all' | 'new_only' | 'updates_only') => {
    if (!preview?.file_path) return;

    setStep('confirming');
    setError(null);

    try {
      const csrfToken = document.querySelector<HTMLMetaElement>('meta[name="csrf-token"]')?.content;
      const res = await fetch('/appointments/import-confirm', {
        method: 'POST',
        headers: {
          'X-CSRF-TOKEN': csrfToken || '',
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
        credentials: 'same-origin',
        body: JSON.stringify({ file_path: preview.file_path, mode }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => null);
        throw new Error(data?.error || `Import failed (${res.status})`);
      }

      handleClose();
      onImportStarted?.();
    } catch (err: any) {
      setError(err.message || 'Failed to start import.');
      setStep('preview');
    }
  };

  const handleClose = () => {
    setFile(null);
    setStep('upload');
    setLoading(false);
    setError(null);
    setPreview(null);
    if (fileRef.current) fileRef.current.value = '';
    onClose();
  };

  const handleBack = () => {
    setStep('upload');
    setPreview(null);
    setError(null);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={handleClose} />

      {step === 'upload' && (
        <UploadStep
          fileRef={fileRef}
          file={file}
          loading={loading}
          error={error}
          onFileChange={handleFileChange}
          onPreview={handlePreview}
          onClose={handleClose}
        />
      )}

      {step === 'preview' && preview && (
        <PreviewStep
          preview={preview}
          error={error}
          onConfirm={handleConfirm}
          onBack={handleBack}
          onClose={handleClose}
        />
      )}

      {step === 'confirming' && (
        <div className="relative w-full max-w-md rounded-2xl border border-slate-200 bg-white p-8 shadow-2xl text-center">
          <Loader2 size={32} className="mx-auto animate-spin text-violet-500 mb-3" />
          <p className="text-sm font-semibold text-slate-700">Starting import...</p>
          <p className="text-xs text-slate-500 mt-1">Records are being processed in the background.</p>
        </div>
      )}
    </div>
  );
};

// ── Upload Step ─────────────────────────────────────────────────────────────────

interface UploadStepProps {
  fileRef: React.RefObject<HTMLInputElement | null>;
  file: File | null;
  loading: boolean;
  error: string | null;
  onFileChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onPreview: (e: React.FormEvent) => void;
  onClose: () => void;
}

const UploadStep: React.FC<UploadStepProps> = ({ fileRef, file, loading, error, onFileChange, onPreview, onClose }) => (
  <div className="relative w-full max-w-md rounded-2xl border border-slate-200 bg-white p-6 shadow-2xl">
    <div className="mb-5 flex items-center justify-between">
      <div className="flex items-center gap-2.5">
        <div className="rounded-lg bg-violet-100 p-2 text-violet-500">
          <Upload size={17} />
        </div>
        <h2 className="text-base font-semibold text-slate-800">Import CSV / Excel</h2>
      </div>
      <button onClick={onClose} className="rounded-lg p-1.5 text-slate-400 transition hover:bg-slate-100 hover:text-slate-700">
        <X size={17} />
      </button>
    </div>

    <form onSubmit={onPreview} className="space-y-4">
      <div
        className="flex cursor-pointer flex-col items-center gap-3 rounded-xl border-2 border-dashed border-slate-200 p-6 text-center transition hover:border-violet-400 hover:bg-violet-50/30"
        onClick={() => fileRef.current?.click()}
      >
        {file ? (
          <>
            <FileText size={28} className="text-violet-500" />
            <span className="text-sm font-medium text-slate-800">{file.name}</span>
            <span className="text-xs text-slate-500">{(file.size / 1024).toFixed(1)} KB</span>
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
          onChange={onFileChange}
        />
      </div>

      <p className="text-xs text-slate-500">
        The file will be previewed before importing — you can review new and updated records.
      </p>

      {error && (
        <div className="flex items-center gap-2 rounded-lg border border-rose-400/25 bg-rose-500/10 px-3 py-2">
          <AlertTriangle size={14} className="shrink-0 text-rose-500" />
          <p className="text-sm text-rose-600">{error}</p>
        </div>
      )}

      <div className="flex gap-2.5">
        <button
          type="button"
          onClick={onClose}
          className="flex-1 rounded-xl border border-slate-200 py-2.5 text-sm font-medium text-slate-600 transition hover:bg-slate-50 hover:text-slate-800"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={!file || loading}
          className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-violet-500 to-purple-600 px-4 py-2.5 text-sm font-semibold text-white shadow-md transition hover:from-violet-400 hover:to-purple-500 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {loading ? (
            <>
              <Loader2 size={14} className="animate-spin" />
              Analyzing...
            </>
          ) : (
            <>
              <Upload size={14} />
              Preview Import
            </>
          )}
        </button>
      </div>
    </form>
  </div>
);

// ── Preview Step ────────────────────────────────────────────────────────────────

interface PreviewStepProps {
  preview: ImportPreviewResult;
  error: string | null;
  onConfirm: (mode: 'all' | 'new_only' | 'updates_only') => void;
  onBack: () => void;
  onClose: () => void;
}

const AuthBadge: React.FC<{ tag: string }> = ({ tag }) => {
  if (!tag) return <span className="text-xs text-slate-400">—</span>;
  if (tag === 'Auth Active') {
    return (
      <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 px-2 py-0.5 text-xs font-medium text-emerald-700">
        <ShieldCheck size={11} /> Auth Active
      </span>
    );
  }
  if (tag === 'For Review') {
    return (
      <span className="inline-flex items-center gap-1 rounded-full bg-amber-100 px-2 py-0.5 text-xs font-medium text-amber-700">
        <ShieldQuestion size={11} /> For Review
      </span>
    );
  }
  return <span className="text-xs text-slate-500">{tag}</span>;
};

const PreviewStep: React.FC<PreviewStepProps> = ({ preview, error, onConfirm, onBack, onClose }) => {
  const hasNew = preview.new_records.length > 0;
  const hasUpdates = preview.update_records.length > 0;
  const hasAny = hasNew || hasUpdates;

  const confirmMode = (): 'all' | 'new_only' | 'updates_only' => {
    if (hasNew && hasUpdates) return 'all';
    if (hasNew) return 'new_only';
    return 'updates_only';
  };

  return (
    <div className="relative w-full max-w-4xl rounded-2xl border border-slate-200 bg-white shadow-2xl flex flex-col max-h-[90vh]">
      {/* Header */}
      <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-3">
          <button onClick={onBack} className="rounded-lg p-1.5 text-slate-400 transition hover:bg-slate-100 hover:text-slate-700">
            <ArrowLeft size={17} />
          </button>
          <div>
            <h2 className="text-base font-semibold text-slate-800">Import Preview</h2>
            <p className="text-xs text-slate-500">
              {preview.total_rows} total rows — {preview.new_records.length} new, {preview.update_records.length} updates, {preview.skip_count} duplicates skipped
            </p>
          </div>
        </div>
        <button onClick={onClose} className="rounded-lg p-1.5 text-slate-400 transition hover:bg-slate-100 hover:text-slate-700">
          <X size={17} />
        </button>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-6 space-y-6">
        {!hasAny && (
          <div className="text-center py-12">
            <CheckCircle size={40} className="mx-auto text-emerald-400 mb-3" />
            <p className="text-sm font-semibold text-slate-700">All records are already up to date</p>
            <p className="text-xs text-slate-500 mt-1">{preview.skip_count} duplicate records were found and will be skipped.</p>
          </div>
        )}

        {/* Update Records Section */}
        {hasUpdates && (
          <div>
            <div className="flex items-center gap-2 mb-3">
              <div className="rounded-lg bg-amber-100 p-1.5 text-amber-600">
                <RefreshCw size={14} />
              </div>
              <div>
                <h3 className="text-sm font-semibold text-slate-800">
                  Records to Update ({preview.update_records.length})
                </h3>
                <p className="text-xs text-slate-500">These records exist but have updated Modification History.</p>
              </div>
            </div>
            <RecordTable records={preview.update_records} showModification />
          </div>
        )}

        {/* New Records Section */}
        {hasNew && (
          <div>
            <div className="flex items-center gap-2 mb-3">
              <div className="rounded-lg bg-emerald-100 p-1.5 text-emerald-600">
                <CheckCircle size={14} />
              </div>
              <div>
                <h3 className="text-sm font-semibold text-slate-800">
                  New Records ({preview.new_records.length})
                </h3>
                <p className="text-xs text-slate-500">These records will be added to the system.</p>
              </div>
            </div>
            <RecordTable records={preview.new_records} />
          </div>
        )}

        {preview.skip_count > 0 && hasAny && (
          <p className="text-xs text-slate-500 text-center">
            {preview.skip_count} duplicate record(s) will be skipped.
          </p>
        )}
      </div>

      {error && (
        <div className="mx-6 mb-2 flex items-center gap-2 rounded-lg border border-rose-400/25 bg-rose-500/10 px-3 py-2">
          <AlertTriangle size={14} className="shrink-0 text-rose-500" />
          <p className="text-sm text-rose-600">{error}</p>
        </div>
      )}

      {/* Footer */}
      <div className="px-6 py-4 border-t border-slate-200 flex justify-end gap-2.5 shrink-0 bg-slate-50 rounded-b-2xl">
        <button
          type="button"
          onClick={onClose}
          className="rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-medium text-slate-600 transition hover:bg-white hover:text-slate-800"
        >
          Cancel
        </button>
        {hasAny && (
          <button
            type="button"
            onClick={() => onConfirm(confirmMode())}
            className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-violet-500 to-purple-600 px-5 py-2.5 text-sm font-semibold text-white shadow-md transition hover:from-violet-400 hover:to-purple-500"
          >
            <Upload size={14} />
            {hasUpdates && !hasNew
              ? `Confirm Update (${preview.update_records.length})`
              : hasNew && !hasUpdates
                ? `Confirm Import (${preview.new_records.length})`
                : `Confirm Import & Update (${preview.new_records.length + preview.update_records.length})`
            }
          </button>
        )}
      </div>
    </div>
  );
};

// ── Record Table ────────────────────────────────────────────────────────────────

interface RecordTableProps {
  records: ImportPreviewRecord[];
  showModification?: boolean;
}

const RecordTable: React.FC<RecordTableProps> = ({ records, showModification = false }) => {
  const [page, setPage] = useState(0);
  const perPage = 10;
  const totalPages = Math.ceil(records.length / perPage);
  const paged = records.slice(page * perPage, (page + 1) * perPage);

  return (
    <div className="rounded-xl border border-slate-200 overflow-hidden">
      <div className="overflow-x-auto">
        <table className="min-w-full text-xs">
          <thead className="bg-slate-50 border-b border-slate-200">
            <tr>
              <th className="px-3 py-2 text-left font-semibold text-slate-600">Patient ID</th>
              <th className="px-3 py-2 text-left font-semibold text-slate-600">Patient Name</th>
              <th className="px-3 py-2 text-left font-semibold text-slate-600">Date of Service</th>
              <th className="px-3 py-2 text-left font-semibold text-slate-600">Status</th>
              <th className="px-3 py-2 text-left font-semibold text-slate-600">Provider</th>
              <th className="px-3 py-2 text-left font-semibold text-slate-600">Auth</th>
              {showModification && (
                <th className="px-3 py-2 text-left font-semibold text-slate-600">Modification Change</th>
              )}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {paged.map((record, idx) => (
              <tr key={`${record.patient_id}-${record.date_of_service}-${idx}`} className="hover:bg-slate-50/50">
                <td className="px-3 py-2 text-slate-700 font-medium">{record.patient_id}</td>
                <td className="px-3 py-2 text-slate-700">{record.patient_name}</td>
                <td className="px-3 py-2 text-slate-600">{record.date_of_service}</td>
                <td className="px-3 py-2">
                  <span className={`inline-block rounded-full px-2 py-0.5 text-xs font-medium ${
                    record.appointment_status === 'Cancel'
                      ? 'bg-rose-100 text-rose-700'
                      : record.appointment_status === 'New'
                        ? 'bg-blue-100 text-blue-700'
                        : record.appointment_status === 'Checked In'
                          ? 'bg-emerald-100 text-emerald-700'
                          : 'bg-slate-100 text-slate-600'
                  }`}>
                    {record.appointment_status}
                  </span>
                </td>
                <td className="px-3 py-2 text-slate-600">{record.provider}</td>
                <td className="px-3 py-2"><AuthBadge tag={record.auth_tag} /></td>
                {showModification && (
                  <td className="px-3 py-2">
                    <span className="text-xs text-amber-600 font-medium">Updated</span>
                  </td>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {totalPages > 1 && (
        <div className="flex items-center justify-between px-3 py-2 bg-slate-50 border-t border-slate-200">
          <span className="text-xs text-slate-500">
            Showing {page * perPage + 1}–{Math.min((page + 1) * perPage, records.length)} of {records.length}
          </span>
          <div className="flex gap-1">
            <button
              onClick={() => setPage(p => Math.max(0, p - 1))}
              disabled={page === 0}
              className="rounded px-2 py-1 text-xs font-medium text-slate-600 hover:bg-slate-200 disabled:opacity-40"
            >
              Prev
            </button>
            <button
              onClick={() => setPage(p => Math.min(totalPages - 1, p + 1))}
              disabled={page >= totalPages - 1}
              className="rounded px-2 py-1 text-xs font-medium text-slate-600 hover:bg-slate-200 disabled:opacity-40"
            >
              Next
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
