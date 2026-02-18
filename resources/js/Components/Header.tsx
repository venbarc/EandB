import React, { useRef } from 'react';
import { router } from '@inertiajs/react';
import {
  LayoutDashboard,
  Building2,
  Users,
  BookOpen,
  MessageSquare,
  Download,
  Upload,
  Loader2,
} from 'lucide-react';
import { FilterState } from '@/types';

interface HeaderProps {
  filters?: FilterState;
}

export const Header: React.FC<HeaderProps> = ({ filters = {} }) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [importing, setImporting] = React.useState(false);

  const handleImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setImporting(true);
    const formData = new FormData();
    formData.append('file', file);

    router.post('/appointments/import', formData as unknown as Record<string, unknown>, {
      forceFormData: true,
      onSuccess: () => setImporting(false),
      onError:   () => setImporting(false),
      onFinish:  () => {
        setImporting(false);
        if (fileInputRef.current) fileInputRef.current.value = '';
      },
    });
  };

  const buildExportUrl = (base: string) => {
    const params = new URLSearchParams();
    if (filters.date)     params.set('date',     filters.date);
    if (filters.patient)  params.set('patient',  filters.patient);
    if (filters.provider) params.set('provider', filters.provider);
    if (filters.status)   params.set('status',   filters.status);
    (filters.insurances ?? []).forEach(ins => params.append('insurances[]', ins));
    const qs = params.toString();
    return qs ? `${base}?${qs}` : base;
  };

  return (
    <header className="bg-white border-b border-gray-200 sticky top-0 z-40 shadow-sm">
      <div className="max-w-[1920px] mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">

          {/* Left: Logo & Title */}
          <div className="flex items-center gap-4">
            <div className="bg-brand-600 text-white p-2 rounded-lg">
              <LayoutDashboard size={24} />
            </div>
            <h1 className="text-xl font-bold text-gray-800 tracking-tight">
              Eligibility &amp; Benefits
            </h1>
          </div>

          {/* Center: Navigation */}
          <nav className="hidden md:flex space-x-1">
            {(['Dashboard', 'Department', 'Directory', 'Resources'] as const).map((item, idx) => (
              <a
                key={item}
                href="#"
                className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                  idx === 0
                    ? 'text-brand-700 bg-brand-50'
                    : 'text-gray-600 hover:text-brand-600 hover:bg-gray-50'
                }`}
              >
                {item}
              </a>
            ))}
          </nav>

          {/* Right: Actions */}
          <div className="flex items-center gap-3">
            <button className="text-gray-500 hover:text-gray-700 text-sm font-medium flex items-center gap-1 mr-2">
              <MessageSquare size={16} /> Feedback
            </button>
            <div className="h-6 w-px bg-gray-200 mx-1" />

            {/* Export All */}
            <a
              href={buildExportUrl('/appointments/export')}
              className="bg-gray-800 hover:bg-gray-900 text-white px-4 py-2 rounded-lg text-sm font-medium shadow-sm flex items-center gap-2 transition-all"
            >
              <Download size={16} /> Export All
            </a>

            {/* Export Availity */}
            <a
              href={buildExportUrl('/appointments/export/availity')}
              className="bg-brand-600 hover:bg-brand-700 text-white px-4 py-2 rounded-lg text-sm font-medium shadow-sm flex items-center gap-2 transition-all"
            >
              <Download size={16} /> Export Availity
            </a>

            {/* Import Availity */}
            <button
              onClick={() => fileInputRef.current?.click()}
              disabled={importing}
              className="bg-white border border-gray-300 text-gray-700 hover:bg-gray-50 px-4 py-2 rounded-lg text-sm font-medium shadow-sm flex items-center gap-2 transition-all disabled:opacity-60"
            >
              {importing
                ? <><Loader2 size={16} className="animate-spin" /> Importing…</>
                : <><Upload size={16} /> Import Availity</>
              }
            </button>

            {/* Hidden file input */}
            <input
              ref={fileInputRef}
              type="file"
              accept=".xlsx,.xls,.csv"
              className="hidden"
              onChange={handleImport}
            />
          </div>
        </div>
      </div>
    </header>
  );
};
