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
} from 'lucide-react';
import { FilterState, ImportResult } from '@/types';
import { ImportModal } from '@/Components/ImportModal';

interface HeaderProps {
  filters?: FilterState;
}

export const Header: React.FC<HeaderProps> = ({ filters = {} }) => {
  const [loggingOut, setLoggingOut] = React.useState(false);
  const [isImportOpen, setIsImportOpen] = React.useState(false);

  const { props } = usePage<{ flash?: { importResult?: ImportResult } }>();
  const importResult = props.flash?.importResult ?? null;

  // Auto-open modal to show results when a fresh importResult arrives.
  const prevResultRef = React.useRef(importResult);
  React.useEffect(() => {
    if (importResult && importResult !== prevResultRef.current) {
      setIsImportOpen(true);
    }
    prevResultRef.current = importResult;
  }, [importResult]);

  const buildExportUrl = (base: string) => {
    const params = new URLSearchParams();
    if (filters.dateFrom) params.set('dateFrom', filters.dateFrom);
    if (filters.dateTo) params.set('dateTo', filters.dateTo);
    if (filters.ampm) params.set('ampm', filters.ampm);
    if (filters.patient) params.set('patient', filters.patient);
    if (filters.provider) params.set('provider', filters.provider);
    if (filters.status) params.set('status', filters.status);
    if (filters.eligibility) params.set('eligibility', filters.eligibility);
    (filters.insurances ?? []).forEach((insurance) => params.append('insurances[]', insurance));
    const query = params.toString();
    return query ? `${base}?${query}` : base;
  };

  const handleLogout = () => {
    if (loggingOut) return;

    setLoggingOut(true);
    router.post('/logout', {}, {
      onFinish: () => setLoggingOut(false),
    });
  };

  return (
    <>
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
