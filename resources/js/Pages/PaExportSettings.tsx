import React, { useState } from 'react';
import { router, usePage } from '@inertiajs/react';
import {
  ArrowLeft,
  Save,
  Send,
  Loader2,
  Plus,
  X,
  CheckCircle,
  XCircle,
  Clock,
  Mail,
  Settings,
} from 'lucide-react';
import { PaExportSettings as PaExportSettingsType, PaginatedPaExportLogs } from '@/types';

interface PageProps {
  settings: PaExportSettingsType;
  logs: PaginatedPaExportLogs;
  flash?: { success?: string };
}

const PaExportSettings: React.FC<PageProps> = ({ settings, logs }) => {
  const { props } = usePage<PageProps>();
  const flash = props.flash;

  const [enabled, setEnabled] = useState(settings.enabled);
  const [scheduleTime, setScheduleTime] = useState(settings.schedule_time);
  const [exportScope, setExportScope] = useState(settings.export_scope);
  const [recipients, setRecipients] = useState<string[]>(settings.recipients);
  const [newEmail, setNewEmail] = useState('');
  const [emailError, setEmailError] = useState('');
  const [saving, setSaving] = useState(false);
  const [sending, setSending] = useState(false);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  const toastTimer = React.useRef<ReturnType<typeof setTimeout> | null>(null);

  const showToast = (message: string, type: 'success' | 'error') => {
    if (toastTimer.current) clearTimeout(toastTimer.current);
    setToast({ message, type });
    toastTimer.current = setTimeout(() => setToast(null), 5000);
  };

  // Show flash messages
  React.useEffect(() => {
    if (flash?.success) {
      showToast(flash.success, 'success');
    }
  }, [flash?.success]);

  const addRecipient = () => {
    const email = newEmail.trim().toLowerCase();
    if (!email) return;

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      setEmailError('Please enter a valid email address.');
      return;
    }
    if (recipients.includes(email)) {
      setEmailError('This email is already added.');
      return;
    }

    setRecipients([...recipients, email]);
    setNewEmail('');
    setEmailError('');
  };

  const removeRecipient = (email: string) => {
    setRecipients(recipients.filter((r) => r !== email));
  };

  const handleSave = () => {
    setSaving(true);
    router.put('/pa-export-settings', {
      enabled,
      schedule_time: scheduleTime,
      export_scope: exportScope,
      recipients,
    }, {
      onFinish: () => setSaving(false),
    });
  };

  const handleSendNow = () => {
    if (recipients.length === 0) {
      showToast('Please add at least one recipient before sending.', 'error');
      return;
    }
    setSending(true);
    router.post('/pa-export-settings/send', {}, {
      onFinish: () => setSending(false),
    });
  };

  return (
    <div className="relative min-h-screen overflow-hidden bg-gradient-to-br from-slate-50 via-white to-teal-50 pb-20 text-slate-800">
      <div className="pointer-events-none absolute -left-24 top-16 h-64 w-64 rounded-full bg-teal-200/40 blur-3xl" />
      <div className="pointer-events-none absolute bottom-8 right-2 h-72 w-72 rounded-full bg-cyan-200/30 blur-3xl" />

      {/* Toast */}
      {toast && (
        <div className={`fixed bottom-6 right-6 z-50 flex max-w-sm items-start gap-2.5 rounded-xl border px-4 py-3 shadow-lg backdrop-blur-sm ${
          toast.type === 'success'
            ? 'border-emerald-400/60 bg-emerald-50 text-emerald-700'
            : 'border-rose-400/60 bg-rose-50 text-rose-700'
        }`}>
          {toast.type === 'success'
            ? <CheckCircle size={16} className="mt-0.5 shrink-0" />
            : <XCircle size={16} className="mt-0.5 shrink-0" />
          }
          <span className="text-sm font-medium leading-snug">{toast.message}</span>
          <button
            type="button"
            onClick={() => setToast(null)}
            className="ml-1 mt-0.5 shrink-0 text-xs opacity-50 hover:opacity-100"
          >
            <X size={12} />
          </button>
        </div>
      )}

      {/* Header */}
      <header className="sticky top-0 z-40 border-b border-slate-200/80 bg-white/80 shadow-[0_4px_20px_-8px_rgba(20,184,166,0.12)] backdrop-blur-xl">
        <div className="mx-auto w-full max-w-[1920px] px-4 sm:px-6 lg:px-8">
          <div className="flex min-h-20 items-center gap-4 py-3">
            <a
              href="/"
              className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-700 shadow-sm transition hover:bg-slate-50"
            >
              <ArrowLeft size={15} />
              Back
            </a>
            <div className="flex items-center gap-3">
              <div className="rounded-xl bg-gradient-to-br from-amber-500 to-orange-600 p-2.5 text-white shadow-md shadow-amber-500/25">
                <Settings size={20} />
              </div>
              <div>
                <h1 className="text-xl font-semibold tracking-tight text-slate-800">PA Department Export Settings</h1>
                <p className="text-xs font-medium uppercase tracking-[0.16em] text-amber-600">Automated Daily Export</p>
              </div>
            </div>
          </div>
        </div>
      </header>

      <main className="relative z-10 mx-auto w-full max-w-4xl space-y-6 px-4 py-8 sm:px-6 lg:px-8">
        {/* Settings Card */}
        <div className="rounded-2xl border border-slate-200/80 bg-white/90 p-6 shadow-sm backdrop-blur-sm">
          <h2 className="mb-5 text-lg font-semibold text-slate-800">Schedule Configuration</h2>

          <div className="space-y-5">
            {/* Enable/Disable Toggle */}
            <div className="flex items-center justify-between">
              <div>
                <label className="text-sm font-semibold text-slate-700">Enable Automated Export</label>
                <p className="text-xs text-slate-500">When enabled, the export will run daily at the configured time.</p>
              </div>
              <button
                type="button"
                onClick={() => setEnabled(!enabled)}
                className={`relative inline-flex h-7 w-12 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                  enabled ? 'bg-teal-500' : 'bg-slate-300'
                }`}
              >
                <span
                  className={`pointer-events-none inline-block h-6 w-6 rounded-full bg-white shadow ring-0 transition-transform duration-200 ease-in-out ${
                    enabled ? 'translate-x-5' : 'translate-x-0'
                  }`}
                />
              </button>
            </div>

            {/* Schedule Time */}
            <div>
              <label className="mb-1.5 block text-sm font-semibold text-slate-700">
                <Clock size={14} className="mr-1 inline" />
                Schedule Time
              </label>
              <input
                type="time"
                value={scheduleTime}
                onChange={(e) => setScheduleTime(e.target.value)}
                className="w-40 rounded-lg border border-slate-300 px-3 py-2 text-sm shadow-sm focus:border-teal-400 focus:outline-none focus:ring-1 focus:ring-teal-400"
              />
              <p className="mt-1 text-xs text-slate-500">The export will be generated and emailed daily at this time.</p>
            </div>

            {/* Export Scope */}
            <div>
              <label className="mb-1.5 block text-sm font-semibold text-slate-700">Export Scope</label>
              <div className="flex gap-3">
                <label className={`flex cursor-pointer items-center gap-2 rounded-lg border px-4 py-2.5 text-sm font-medium transition ${
                  exportScope === 'all'
                    ? 'border-teal-400 bg-teal-50 text-teal-700'
                    : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50'
                }`}>
                  <input
                    type="radio"
                    name="export_scope"
                    value="all"
                    checked={exportScope === 'all'}
                    onChange={() => setExportScope('all')}
                    className="sr-only"
                  />
                  All Records
                </label>
                <label className={`flex cursor-pointer items-center gap-2 rounded-lg border px-4 py-2.5 text-sm font-medium transition ${
                  exportScope === 'today'
                    ? 'border-teal-400 bg-teal-50 text-teal-700'
                    : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50'
                }`}>
                  <input
                    type="radio"
                    name="export_scope"
                    value="today"
                    checked={exportScope === 'today'}
                    onChange={() => setExportScope('today')}
                    className="sr-only"
                  />
                  Today's Submissions Only
                </label>
              </div>
              <p className="mt-1 text-xs text-slate-500">
                {exportScope === 'all'
                  ? 'Exports all PA Department submitted records (full snapshot).'
                  : 'Exports only records submitted today.'}
              </p>
            </div>

            {/* Email Recipients */}
            <div>
              <label className="mb-1.5 block text-sm font-semibold text-slate-700">
                <Mail size={14} className="mr-1 inline" />
                Email Recipients
              </label>

              {/* Recipient Chips */}
              {recipients.length > 0 && (
                <div className="mb-2 flex flex-wrap gap-2">
                  {recipients.map((email) => (
                    <span
                      key={email}
                      className="inline-flex items-center gap-1.5 rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-sm text-slate-700"
                    >
                      {email}
                      <button
                        type="button"
                        onClick={() => removeRecipient(email)}
                        className="rounded-full p-0.5 text-slate-400 transition hover:bg-slate-200 hover:text-slate-600"
                      >
                        <X size={12} />
                      </button>
                    </span>
                  ))}
                </div>
              )}

              {/* Add Email Input */}
              <div className="flex gap-2">
                <input
                  type="email"
                  value={newEmail}
                  onChange={(e) => { setNewEmail(e.target.value); setEmailError(''); }}
                  onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); addRecipient(); } }}
                  placeholder="Enter email address"
                  className="flex-1 rounded-lg border border-slate-300 px-3 py-2 text-sm shadow-sm focus:border-teal-400 focus:outline-none focus:ring-1 focus:ring-teal-400"
                />
                <button
                  type="button"
                  onClick={addRecipient}
                  className="inline-flex items-center gap-1.5 rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm font-medium text-slate-700 shadow-sm transition hover:bg-slate-50"
                >
                  <Plus size={14} />
                  Add
                </button>
              </div>
              {emailError && (
                <p className="mt-1 text-xs text-rose-500">{emailError}</p>
              )}
            </div>

            {/* Action Buttons */}
            <div className="flex items-center gap-3 border-t border-slate-100 pt-5">
              <button
                type="button"
                onClick={handleSave}
                disabled={saving}
                className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-teal-500 to-cyan-500 px-5 py-2.5 text-sm font-semibold text-white shadow-sm shadow-teal-500/30 transition hover:from-teal-400 hover:to-cyan-400 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {saving ? <Loader2 size={15} className="animate-spin" /> : <Save size={15} />}
                {saving ? 'Saving...' : 'Save Settings'}
              </button>

              <button
                type="button"
                onClick={handleSendNow}
                disabled={sending}
                className="inline-flex items-center gap-2 rounded-xl border border-amber-300 bg-amber-50 px-5 py-2.5 text-sm font-semibold text-amber-700 shadow-sm transition hover:bg-amber-100 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {sending ? <Loader2 size={15} className="animate-spin" /> : <Send size={15} />}
                {sending ? 'Sending...' : 'Send Now'}
              </button>
            </div>
          </div>
        </div>

        {/* Logs Card */}
        <div className="rounded-2xl border border-slate-200/80 bg-white/90 p-6 shadow-sm backdrop-blur-sm">
          <h2 className="mb-4 text-lg font-semibold text-slate-800">Export Logs</h2>

          {logs.data.length === 0 ? (
            <p className="py-8 text-center text-sm text-slate-400">No export logs yet.</p>
          ) : (
            <>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-slate-200 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">
                      <th className="px-3 py-2.5">Date / Time</th>
                      <th className="px-3 py-2.5">Status</th>
                      <th className="px-3 py-2.5">Recipients</th>
                      <th className="px-3 py-2.5">Records</th>
                      <th className="px-3 py-2.5">File</th>
                      <th className="px-3 py-2.5">Error</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {logs.data.map((log) => (
                      <tr key={log.id} className="hover:bg-slate-50/50">
                        <td className="whitespace-nowrap px-3 py-2.5 text-slate-600">
                          {new Date(log.executed_at).toLocaleString()}
                        </td>
                        <td className="px-3 py-2.5">
                          <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-semibold ${
                            log.status === 'success'
                              ? 'bg-emerald-50 text-emerald-700'
                              : 'bg-rose-50 text-rose-700'
                          }`}>
                            {log.status === 'success'
                              ? <CheckCircle size={11} />
                              : <XCircle size={11} />
                            }
                            {log.status}
                          </span>
                        </td>
                        <td className="max-w-[200px] truncate px-3 py-2.5 text-slate-600" title={log.recipients.join(', ')}>
                          {log.recipients.join(', ') || '—'}
                        </td>
                        <td className="px-3 py-2.5 text-slate-600">{log.record_count}</td>
                        <td className="px-3 py-2.5 text-slate-600">{log.file_name || '—'}</td>
                        <td className="max-w-[200px] truncate px-3 py-2.5 text-rose-500" title={log.error_message || ''}>
                          {log.error_message || '—'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Pagination */}
              {logs.meta.last_page > 1 && (
                <div className="mt-4 flex items-center justify-between border-t border-slate-100 pt-4">
                  <p className="text-xs text-slate-500">
                    Showing {logs.meta.from}–{logs.meta.to} of {logs.meta.total} logs
                  </p>
                  <div className="flex gap-1.5">
                    {logs.links.prev && (
                      <a
                        href={logs.links.prev}
                        onClick={(e) => { e.preventDefault(); router.get(logs.links.prev!); }}
                        className="rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-medium text-slate-600 transition hover:bg-slate-50"
                      >
                        Previous
                      </a>
                    )}
                    {logs.links.next && (
                      <a
                        href={logs.links.next}
                        onClick={(e) => { e.preventDefault(); router.get(logs.links.next!); }}
                        className="rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-medium text-slate-600 transition hover:bg-slate-50"
                      >
                        Next
                      </a>
                    )}
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </main>
    </div>
  );
};

export default PaExportSettings;
