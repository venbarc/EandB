import React, { useEffect, useState } from 'react';
import { useForm } from '@inertiajs/react';
import { X, User, Loader2, Plus, Trash2 } from 'lucide-react';
import { Appointment } from '@/types';

const inputCls =
  'w-full border-gray-300 rounded-lg shadow-sm focus:ring-brand-500 focus:border-brand-500 p-2.5 bg-gray-50 border text-sm text-gray-900 placeholder:text-gray-400';
const labelCls = 'block text-sm font-medium text-gray-700 mb-1';

const PSC_STATUSES: { code: string; dot: string; ring: string; bg: string; border: string; text: string }[] = [
  { code: 'Eligibility Completed',     dot: 'bg-amber-400',   ring: 'ring-amber-400',   bg: 'bg-amber-50',   border: 'border-amber-400',   text: 'text-amber-700' },
  { code: 'Eligibility Not Found',     dot: 'bg-red-500',     ring: 'ring-red-400',     bg: 'bg-red-50',     border: 'border-red-400',     text: 'text-red-700' },
  { code: 'No Collection Required',    dot: 'bg-orange-400',  ring: 'ring-orange-400',  bg: 'bg-orange-50',  border: 'border-orange-400',  text: 'text-orange-700' },
  { code: 'Provider Not Credentialed', dot: 'bg-cyan-400',    ring: 'ring-cyan-400',    bg: 'bg-cyan-50',    border: 'border-cyan-400',    text: 'text-cyan-700' },
  { code: 'Payment Completed',         dot: 'bg-emerald-500', ring: 'ring-emerald-400', bg: 'bg-emerald-50', border: 'border-emerald-400', text: 'text-emerald-700' },
  { code: 'Self Pay',                  dot: 'bg-pink-500',    ring: 'ring-pink-400',    bg: 'bg-pink-50',    border: 'border-pink-400',    text: 'text-pink-700' },
];

interface UpdateRecordModalProps {
  isOpen: boolean;
  onClose: () => void;
  record: Appointment | null;
}

export const UpdateRecordModal: React.FC<UpdateRecordModalProps> = ({ isOpen, onClose, record }) => {
  const { data, setData, patch, processing, reset, transform } = useForm({
    provider_credentialed: '' as string,
    eligibility_status: '' as string,
    collection_status: '' as string,
    collection_items: [] as Array<{ status: string; amount: string }>,
    insurance_type: '' as string,
    payments: '' as string,
    auth_status: '' as string,
    referral_status: '' as string,
    notes: '' as string,
    collected_amount: '' as string,
    collected_method: '' as string,
    collected_receipt_no: '' as string,
    submitted: false as boolean,
    psc_code: '' as string,
    psc_description: '' as string,
  });
  const [activeAction, setActiveAction] = React.useState<'save' | 'toggle' | null>(null);
  const [newEntryStatus, setNewEntryStatus] = useState('');
  const [newEntryAmount, setNewEntryAmount] = useState('');

  useEffect(() => {
    if (!record) return;

    setData({
      provider_credentialed:
        record.providerCredentialed === true ? 'Yes' : record.providerCredentialed === false ? 'No' : '',
      eligibility_status: record.eligibilityStatus !== 'Verification Needed' ? record.eligibilityStatus : '',
      collection_status: record.collectionStatus ?? '',
      collection_items: (record.collectionItems ?? []).map(i => ({ status: i.status, amount: String(i.amount) })),
      insurance_type: record.insuranceType ?? '',
      payments: record.paidAmount > 0 ? String(record.paidAmount) : '',
      auth_status: record.authStatus !== 'N/A' ? record.authStatus : '',
      referral_status: record.referralStatus !== 'N/A' ? record.referralStatus : '',
      notes: record.notes ?? '',
      collected_amount: record.collectedAmount !== null ? String(record.collectedAmount) : '',
      collected_method: record.collectedMethod ?? '',
      collected_receipt_no: record.collectedReceiptNo ?? '',
      submitted: record.isSubmittedToPaDept,
      psc_code: record.pscCode ?? '',
      psc_description: record.pscDescription ?? '',
    });
  }, [record?.id]);

  const handleClose = () => {
    reset();
    setActiveAction(null);
    setNewEntryStatus('');
    setNewEntryAmount('');
    onClose();
  };

  const handleAddCollectionEntry = () => {
    if (!newEntryStatus || !newEntryAmount) return;
    setData('collection_items', [...data.collection_items, { status: newEntryStatus, amount: newEntryAmount }]);
    setNewEntryStatus('');
    setNewEntryAmount('');
  };

  const handleRemoveCollectionEntry = (index: number) => {
    setData('collection_items', data.collection_items.filter((_, i) => i !== index));
  };

  const handleSave = () => {
    if (!record) return;
    setActiveAction('save');
    patch(`/appointments/${record.id}`, {
      onSuccess: () => handleClose(),
      onFinish: () => setActiveAction(null),
    });
  };

  const handleTogglePaDeptSubmission = () => {
    if (!record) return;
    const submitted = !record.isSubmittedToPaDept;

    setActiveAction('toggle');
    transform((currentData) => ({
      ...currentData,
      submitted,
    }));

    patch(`/appointments/${record.id}/pa-dept-submission`, {
      onSuccess: () => handleClose(),
      onFinish: () => {
        transform((currentData) => currentData);
        setActiveAction(null);
      },
    });
  };

  if (!isOpen || !record) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-4xl overflow-hidden flex flex-col max-h-[90vh]">
        <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center bg-gray-50">
          <div>
            <h3 className="text-lg font-bold text-gray-900">Update Record</h3>
            <p className="text-sm text-gray-500">Patient: {record.patient.name} (DOB: {record.patient.dob})</p>
          </div>
          <button onClick={handleClose} className="text-gray-400 hover:text-gray-600 transition-colors">
            <X size={24} />
          </button>
        </div>

        <div className="px-6 py-4 border-b border-gray-100">
          <div className="flex items-center justify-center">
            <div className="flex flex-col items-center relative z-10">
              <div className="w-10 h-10 rounded-full flex items-center justify-center border-2 bg-brand-600 border-brand-600 text-white">
                <User size={18} />
              </div>
              <span className="text-xs font-semibold mt-1 text-brand-700">Eligibility</span>
            </div>
          </div>
        </div>

        <div className="p-8 overflow-y-auto custom-scrollbar flex-1 bg-white">
          <div className="space-y-6 animate-in fade-in duration-300">
            <div className="grid grid-cols-2 gap-6">
              <div>
                <label className={labelCls}>Provider Credentialed</label>
                <select
                  value={data.provider_credentialed}
                  onChange={(e) => setData('provider_credentialed', e.target.value)}
                  className={`${inputCls} modal-select`}
                >
                  <option value="">Choose Option</option>
                  <option>Yes</option>
                  <option>No</option>
                </select>
              </div>
              <div>
                <label className={labelCls}>Eligibility Status</label>
                <select
                  value={data.eligibility_status}
                  onChange={(e) => setData('eligibility_status', e.target.value)}
                  className={`${inputCls} modal-select`}
                >
                  <option value="">Choose Option</option>
                  <option>Active</option>
                  <option>Inactive</option>
                  <option>Self Pay</option>
                </select>
              </div>
              <div>
                <label className={labelCls}>Insurance Type</label>
                <select
                  value={data.insurance_type}
                  onChange={(e) => setData('insurance_type', e.target.value)}
                  className={`${inputCls} modal-select`}
                >
                  <option value="">Choose Option</option>
                  <option>Medicare</option>
                  <option>Medicare HMO / PPO</option>
                  <option>Commercial</option>
                  <option>Medicaid</option>
                  <option>Worker&apos;s Comp</option>
                </select>
              </div>
            </div>

            {/* ── Collection Entries ─────────────────────────────── */}
            <div className="pt-4 border-t border-gray-100 space-y-3">
              <span className={labelCls}>Collection</span>
              <div className="flex gap-3 items-end">
                <div className="flex-1">
                  <label className="block text-xs text-gray-500 mb-1">Collection Status</label>
                  <select
                    value={newEntryStatus}
                    onChange={(e) => setNewEntryStatus(e.target.value)}
                    className={`${inputCls} modal-select`}
                  >
                    <option value="">Choose Option</option>
                    <option>Co Pay</option>
                    <option>No Co Pay</option>
                    <option>Co Insurance</option>
                    <option>Deductible</option>
                  </select>
                </div>
                <div className="flex-1">
                  <label className="block text-xs text-gray-500 mb-1">Patient Balance Amount</label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <span className="text-gray-500 sm:text-sm">$</span>
                    </div>
                    <input
                      type="number"
                      min="0"
                      step="0.01"
                      value={newEntryAmount}
                      onChange={(e) => setNewEntryAmount(e.target.value)}
                      onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); handleAddCollectionEntry(); } }}
                      className={`pl-7 ${inputCls}`}
                      placeholder="0.00"
                    />
                  </div>
                </div>
                <button
                  type="button"
                  onClick={handleAddCollectionEntry}
                  disabled={!newEntryStatus || !newEntryAmount}
                  className="flex items-center gap-1.5 rounded-lg bg-teal-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-teal-700 disabled:cursor-not-allowed disabled:opacity-40"
                >
                  <Plus size={15} /> Add
                </button>
              </div>

              {data.collection_items.length > 0 && (
                <div className="rounded-lg border border-gray-200 overflow-hidden">
                  <table className="w-full text-sm">
                    <thead className="bg-gray-50 border-b border-gray-200">
                      <tr>
                        <th className="px-3 py-2 text-left text-xs font-semibold text-gray-600 uppercase tracking-wide">Status</th>
                        <th className="px-3 py-2 text-left text-xs font-semibold text-gray-600 uppercase tracking-wide">Amount</th>
                        <th className="w-10 px-3 py-2" />
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {data.collection_items.map((entry, idx) => (
                        <tr key={idx} className="bg-white hover:bg-gray-50">
                          <td className="px-3 py-2 text-gray-700">{entry.status}</td>
                          <td className="px-3 py-2 text-gray-700 font-medium">${parseFloat(entry.amount).toFixed(2)}</td>
                          <td className="px-3 py-2 text-right">
                            <button
                              type="button"
                              onClick={() => handleRemoveCollectionEntry(idx)}
                              className="rounded p-1 text-red-400 transition hover:bg-red-50 hover:text-red-600"
                              title="Remove"
                            >
                              <Trash2 size={14} />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            <div className="grid grid-cols-2 gap-6 pt-4 border-t border-gray-100">
              <div className="space-y-3">
                <span className={labelCls}>Auth Required?</span>
                <div className="flex gap-4">
                  {[{ value: 'Auth Active', label: 'Auth Active' }, { value: 'No Auth Required', label: 'No Auth Required' }, { value: 'Auth Required', label: 'Auth Required' }].map(({ value: v, label }) => (
                    <label key={v} className="flex items-center cursor-pointer">
                      <input
                        type="radio"
                        name="auth"
                        checked={data.auth_status === v}
                        onChange={() => setData('auth_status', v)}
                        className="text-brand-600 focus:ring-brand-500"
                      />
                      <span className="ml-2 text-sm text-gray-600">{label}</span>
                    </label>
                  ))}
                </div>
              </div>
              <div className="space-y-3">
                <span className={labelCls}>Referral Required?</span>
                <div className="flex gap-4">
                  {['Required', 'N/A'].map((v) => (
                    <label key={v} className="flex items-center cursor-pointer">
                      <input
                        type="radio"
                        name="referral"
                        checked={data.referral_status === v}
                        onChange={() => setData('referral_status', v)}
                        className="text-brand-600 focus:ring-brand-500"
                      />
                      <span className="ml-2 text-sm text-gray-600">{v === 'Required' ? 'Yes' : 'No'}</span>
                    </label>
                  ))}
                </div>
              </div>
            </div>

            {/* PSC Status */}
            <div className="pt-4 border-t border-gray-100 space-y-3">
              <span className={labelCls}>PSC Status</span>
              <div className="grid grid-cols-3 gap-2.5">
                {PSC_STATUSES.map(({ code, dot, ring, bg, border, text }) => {
                  const selected = data.psc_code === code;
                  return (
                    <button
                      key={code}
                      type="button"
                      onClick={() => setData('psc_code', selected ? '' : code)}
                      className={`flex items-center gap-2.5 rounded-xl border px-3 py-2.5 text-left transition-all ${
                        selected
                          ? `${bg} ${border} ring-2 ring-offset-1 ${ring} shadow-sm`
                          : 'border-gray-200 bg-white hover:bg-gray-50'
                      }`}
                    >
                      <span className={`h-3 w-3 shrink-0 rounded-full ${dot}`} />
                      <span className={`text-xs font-medium leading-tight ${selected ? text : 'text-gray-700'}`}>
                        {code}
                      </span>
                    </button>
                  );
                })}
              </div>
              <div>
                <label className={labelCls}>PSC Description</label>
                <input
                  type="text"
                  value={data.psc_description}
                  onChange={(e) => setData('psc_description', e.target.value)}
                  className={inputCls}
                  placeholder="Enter additional notes for this status..."
                />
              </div>
            </div>

            <div>
              <label className={labelCls}>Notes</label>
              <textarea
                value={data.notes}
                onChange={(e) => setData('notes', e.target.value)}
                className={`${inputCls} resize-none`}
                rows={3}
                placeholder="Enter any additional details..."
              />
            </div>
          </div>
        </div>

        <div className="px-6 py-4 bg-gray-50 border-t border-gray-200 flex justify-end gap-3">
          <button
            onClick={handleTogglePaDeptSubmission}
            disabled={processing}
            className={`px-5 py-2.5 rounded-lg font-medium shadow-sm transition-all text-sm flex items-center gap-2 disabled:opacity-60 ${
              record.isSubmittedToPaDept
                ? 'bg-rose-600 text-white hover:bg-rose-700'
                : 'bg-amber-500 text-white hover:bg-amber-600'
            }`}
          >
            {processing && activeAction === 'toggle' ? (
              <>
                <Loader2 size={16} className="animate-spin" /> {record.isSubmittedToPaDept ? 'Removing...' : 'Submitting...'}
              </>
            ) : (
              record.isSubmittedToPaDept ? 'Remove from PA Dept' : 'Submit to PA Dept'
            )}
          </button>
          <button
            onClick={handleClose}
            className="px-5 py-2.5 rounded-lg border border-gray-300 text-gray-700 font-medium hover:bg-white hover:shadow-sm transition-all text-sm"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={processing}
            className="px-5 py-2.5 rounded-lg bg-brand-600 text-white font-medium hover:bg-brand-700 shadow-sm transition-all text-sm flex items-center gap-2 disabled:opacity-60"
          >
            {processing ? (
              <>
                <Loader2 size={16} className="animate-spin" /> {activeAction === 'save' ? 'Saving...' : 'Processing...'}
              </>
            ) : (
              'Save'
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
