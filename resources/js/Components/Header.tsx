import React from 'react';
import { router, usePage } from '@inertiajs/react';
import {
  LayoutDashboard,
  MessageSquare,
  Download,
  Loader2,
  Sparkles,
  LogOut,
  Upload,
  RefreshCw,
  CheckCircle,
  XCircle,
} from 'lucide-react';
import { FilterState, ImportResult } from '@/types';
import { ImportModal } from '@/Components/ImportModal';

interface SyncProgress {
  state: 'idle' | 'running' | 'complete' | 'error';
  batch?:    number;
  imported?: number;
  skipped?:  number;
  page?:     number;
  error?:    string;
}

interface HeaderProps {
  filters?: FilterState;
}

export const Header: React.FC<HeaderProps> = ({ filters = {} }) => {
  const [loggingOut, setLoggingOut]     = React.useState(false);
  const [isImportOpen, setIsImportOpen] = React.useState(false);
  const [isSyncing, setIsSyncing]       = React.useState(false);
  const [toast, setToast]               = React.useState<{ message: string; type: 'success' | 'error' } | null>(null);
  const [syncProgress, setSyncProgress] = React.useState<SyncProgress | null>(null);

  const toastTimerRef = React.useRef<ReturnType<typeof setTimeout> | null>(null);
  const pollRef       = React.useRef<ReturnType<typeof setInterval> | null>(null);
  const lastBatchRef  = React.useRef<number>(0);

  const { props } = usePage<{ flash?: { success?: string; importResult?: ImportResult } }>();
  const importResult   = props.flash?.importResult ?? null;
  const successMessage = props.flash?.success ?? null;

  // ── Shared toast helper (always cancels previous timer) ─────────────────
  const showToast = React.useCallback((message: string, type: 'success' | 'error', duration = 6000) => {
    if (toastTimerRef.current) clearTimeout(toastTimerRef.current);
    setToast({ message, type });
    toastTimerRef.current = setTimeout(() => {
      setToast(null);
      toastTimerRef.current = null;
    }, duration);
  }, []);

  // ── Auto-open import modal on fresh importResult ─────────────────────────
  const prevResultRef = React.useRef(importResult);
  React.useEffect(() => {
    if (importResult && importResult !== prevResultRef.current) {
      setIsImportOpen(true);
    }
    prevResultRef.current = importResult;
  }, [importResult]);

  // ── Flash success toast — only when polling is NOT active ────────────────
  const prevSuccessRef = React.useRef(successMessage);
  React.useEffect(() => {
    if (successMessage && successMessage !== prevSuccessRef.current && !pollRef.current) {
      showToast(successMessage, 'success', 7000);
    }
    prevSuccessRef.current = successMessage;
  }, [successMessage, showToast]);

  // ── Polling ──────────────────────────────────────────────────────────────
  const stopPolling = React.useCallback(() => {
    if (pollRef.current) {
      clearInterval(pollRef.current);
      pollRef.current = null;
    }
  }, []);

  const startPolling = React.useCallback(() => {
    stopPolling();
    lastBatchRef.current = 0;

    const poll = async () => {
      try {
        const res = await fetch('/appointments/sync-progress', { credentials: 'same-origin' });
        if (!res.ok) return;

        const data: SyncProgress = await res.json();
        setSyncProgress(data.state === 'idle' ? null : data);

        // Toast once per completed batch + refresh table so records appear immediately
        if (data.state === 'running' && data.batch && data.batch > lastBatchRef.current) {
          lastBatchRef.current = data.batch;
          showToast(
            `Batch ${data.batch} complete — ${(data.imported ?? 0).toLocaleString()} imported so far`,
            'success',
            5000,
          );
          router.reload({ only: ['appointments', 'stats'] });
        }

        if (data.state === 'complete') {
          stopPolling();
          setSyncProgress(null);
          showToast(
            `Sync complete — ${(data.imported ?? 0).toLocaleString()} imported, ${(data.skipped ?? 0).toLocaleString()} skipped`,
            'success',
            8000,
          );
          // Partial reload — Header stays mounted so the toast remains visible
          router.reload({ only: ['appointments', 'stats'] });
        } else if (data.state === 'error') {
          stopPolling();
          setSyncProgress(null);
          showToast(`Sync failed: ${data.error ?? 'Unknown error'}`, 'error', 10000);
        } else if (data.state === 'idle') {
          stopPolling();
        }
      } catch {
        // Ignore transient fetch errors — the next tick will retry
      }
    };

    poll(); // immediate first check
    pollRef.current = setInterval(poll, 3000);
  }, [stopPolling, showToast]);

  // On mount: resume polling if a sync is already in progress (e.g. after page refresh)
  React.useEffect(() => {
    const checkOnMount = async () => {
      try {
        const res = await fetch('/appointments/sync-progress', { credentials: 'same-origin' });
        if (!res.ok) return;
        const data: SyncProgress = await res.json();
        if (data.state === 'running') {
          setSyncProgress(data);
          startPolling();
        }
      } catch { /* ignore */ }
    };
    checkOnMount();
  }, [startPolling]);

  // Cleanup interval on unmount
  React.useEffect(() => stopPolling, [stopPolling]);

  // ── Handlers ─────────────────────────────────────────────────────────────
  const buildExportUrl = (base: string) => {
    const params = new URLSearchParams();
    if (filters.dateFrom)   params.set('dateFrom', filters.dateFrom);
    if (filters.dateTo)     params.set('dateTo', filters.dateTo);
    if (filters.ampm)       params.set('ampm', filters.ampm);
    if (filters.patient)    params.set('patient', filters.patient);
    if (filters.provider)   params.set('provider', filters.provider);
    if (filters.status)     params.set('status', filters.status);
    if (filters.eligibility) params.set('eligibility', filters.eligibility);
    (filters.insurances ?? []).forEach((ins) => params.append('insurances[]', ins));
    const query = params.toString();
    return query ? `${base}?${query}` : base;
  };

  const handleSync = () => {
    if (isSyncing || syncProgress?.state === 'running') return;
    setIsSyncing(true);
    router.post('/appointments/sync-api', {}, {
      onSuccess: () => startPolling(),
      onFinish:  () => setIsSyncing(false),
    });
  };

  const handleLogout = () => {
    if (loggingOut) return;
    setLoggingOut(true);
    router.post('/logout', {}, {
      onFinish: () => setLoggingOut(false),
    });
  };

  const isSyncRunning = syncProgress?.state === 'running';

  return (
    <>
      {/* ── Toast (bottom-right) ─────────────────────────────────────────── */}
      {toast && (
        <div className={`fixed bottom-6 right-6 z-50 flex max-w-sm items-start gap-2.5 rounded-xl border px-4 py-3 shadow-lg backdrop-blur-sm ${
          toast.type === 'success'
            ? 'border-emerald-400/40 bg-emerald-500/15 text-emerald-200'
            : 'border-rose-400/40 bg-rose-500/15 text-rose-200'
        }`}>
          {toast.type === 'success'
            ? <CheckCircle size={16} className="mt-0.5 shrink-0" />
            : <XCircle    size={16} className="mt-0.5 shrink-0" />
          }
          <span className="text-sm font-medium leading-snug">{toast.message}</span>
          <button
            type="button"
            onClick={() => { if (toastTimerRef.current) clearTimeout(toastTimerRef.current); setToast(null); }}
            className="ml-1 mt-0.5 shrink-0 text-xs opacity-50 hover:opacity-100"
          >✕</button>
        </div>
      )}

      {/* ── Sync progress panel (bottom-left, shown while batches run) ───── */}
      {isSyncRunning && syncProgress && (
        <div className="fixed bottom-6 left-6 z-50 flex items-center gap-3 rounded-xl border border-cyan-400/30 bg-slate-900/90 px-4 py-3 shadow-lg backdrop-blur-sm">
          <Loader2 size={18} className="shrink-0 animate-spin text-cyan-400" />
          <div className="text-sm leading-tight">
            <p className="font-semibold text-cyan-200">
              Syncing… Batch {syncProgress.batch ?? '—'}
            </p>
            <p className="text-xs text-slate-400">
              {(syncProgress.imported ?? 0).toLocaleString()} imported
              &nbsp;·&nbsp;
              {(syncProgress.skipped ?? 0).toLocaleString()} skipped
            </p>
          </div>
        </div>
      )}

      <header className="sticky top-0 z-40 border-b border-white/10 bg-slate-900/55 shadow-[0_12px_28px_-20px_rgba(2,12,27,0.95)] backdrop-blur-xl">
        <div className="mx-auto w-full max-w-[1920px] px-4 sm:px-6 lg:px-8">
          <div className="flex min-h-20 flex-wrap items-center justify-between gap-3 py-3">
            <div className="flex items-center gap-3">
              <div className="rounded-xl bg-gradient-to-br from-cyan-500 to-blue-700 p-2.5 text-white shadow-md shadow-cyan-500/25">
                <LayoutDashboard size={20} />
              </div>
              <div>
                <h1 className="text-xl font-semibold tracking-tight text-white">Eligibility &amp; Benefits</h1>
                <p className="text-xs font-medium uppercase tracking-[0.16em] text-cyan-200/90">CF-Outsourcing</p>
              </div>
            </div>

            <nav className="hidden items-center gap-1 rounded-xl border border-white/10 bg-slate-900/50 p-1 lg:flex">
              {['Dashboard', 'Department', 'Directory', 'Resources'].map((item, index) => (
                <a
                  key={item}
                  href="#"
                  className={`rounded-lg px-4 py-2 text-sm font-medium transition ${
                    index === 0
                      ? 'bg-gradient-to-r from-cyan-500/20 to-blue-500/20 text-cyan-200'
                      : 'text-slate-300 hover:bg-white/10 hover:text-white'
                  }`}
                >
                  {item}
                </a>
              ))}
            </nav>

            <div className="flex flex-wrap items-center gap-2.5">
              <button className="inline-flex items-center gap-1.5 rounded-lg px-2.5 py-2 text-sm font-medium text-slate-300 transition hover:bg-white/10 hover:text-white">
                <MessageSquare size={15} />
                Feedback
              </button>

              <button
                onClick={() => setIsImportOpen(true)}
                className="inline-flex items-center gap-2 rounded-xl border border-white/15 bg-slate-950/70 px-3.5 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-slate-800/80"
              >
                <Upload size={15} />
                Import CSV
              </button>

              <button
                onClick={handleSync}
                disabled={isSyncing || isSyncRunning}
                className="inline-flex items-center gap-2 rounded-xl border border-white/15 bg-slate-950/70 px-3.5 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-slate-800/80 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {isSyncing || isSyncRunning ? (
                  <>
                    <Loader2 size={15} className="animate-spin" />
                    Syncing…
                  </>
                ) : (
                  <>
                    <RefreshCw size={15} />
                    Sync API
                  </>
                )}
              </button>

              <a
                href={buildExportUrl('/appointments/export')}
                className="inline-flex items-center gap-2 rounded-xl border border-white/15 bg-slate-950/70 px-3.5 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-slate-800/80"
              >
                <Download size={15} />
                Export All
              </a>

              <a
                href={buildExportUrl('/appointments/export/availity')}
                className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-cyan-500 to-teal-500 px-3.5 py-2 text-sm font-semibold text-white shadow-sm shadow-cyan-500/30 transition hover:from-cyan-400 hover:to-teal-400"
              >
                <Sparkles size={15} />
                Export Availity
              </a>

              <a
                href={buildExportUrl('/appointments/export/pa-dept')}
                className="inline-flex items-center gap-2 rounded-xl border border-amber-300/40 bg-amber-500/15 px-3.5 py-2 text-sm font-semibold text-amber-100 shadow-sm transition hover:bg-amber-500/25"
              >
                <Download size={15} />
                Export PA Dept
              </a>

              <button
                onClick={handleLogout}
                disabled={loggingOut}
                className="inline-flex items-center gap-2 rounded-xl border border-rose-400/35 bg-rose-500/10 px-3.5 py-2 text-sm font-semibold text-rose-200 shadow-sm transition hover:bg-rose-500/20 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {loggingOut ? (
                  <>
                    <Loader2 size={15} className="animate-spin" />
                    Logging out...
                  </>
                ) : (
                  <>
                    <LogOut size={15} />
                    Logout
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </header>

      <ImportModal
        isOpen={isImportOpen}
        onClose={() => setIsImportOpen(false)}
        importResult={importResult}
      />
    </>
  );
};
