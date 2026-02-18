import React, { useState, useEffect } from 'react';
import { useForm } from '@inertiajs/react';
import { X, CheckCircle2, ChevronRight, DollarSign, FileText, User, Loader2 } from 'lucide-react';
import { Appointment } from '@/types';

// ── Shared label + input styles ─────────────────────────────────────────────
const inputCls = 'w-full border-gray-300 rounded-lg shadow-sm focus:ring-brand-500 focus:border-brand-500 p-2.5 bg-gray-50 border text-sm';
const labelCls = 'block text-sm font-medium text-gray-700 mb-1';

const PSC_CODES = [
  'Eligibility Completed',
  'Eligibility Not Found',
  'No Collection Required',
  'Provider Not Credentialed',
  'Payment Completed',
  'Self Pay',
];

// ════════════════════════════════════════════════════════════════════════════
// UpdateRecordModal
// ════════════════════════════════════════════════════════════════════════════
interface UpdateRecordModalProps {
  isOpen: boolean;
  onClose: () => void;
  record: Appointment | null;
}

export const UpdateRecordModal: React.FC<UpdateRecordModalProps> = ({ isOpen, onClose, record }) => {
  const [step, setStep] = useState(1);

  const { data, setData, patch, processing, reset } = useForm({
    provider_credentialed: '' as string,
    eligibility_status:    '' as string,
    collection_status:     '' as string,
    payments:              '' as string,  // patient balance
    auth_status:           '' as string,
    referral_status:       '' as string,
    notes:                 '' as string,
    // Step 2 – Collect
    collected_amount:      '' as string,
    collected_method:      '' as string,
    collected_receipt_no:  '' as string,
  });

  // Pre-populate when record changes
  useEffect(() => {
    if (record) {
      setData({
        provider_credentialed: record.providerCredentialed === true ? 'Yes' : record.providerCredentialed === false ? 'No' : '',
        eligibility_status:    record.eligibilityStatus !== 'Verification Needed' ? record.eligibilityStatus : '',
        collection_status:     record.collectionStatus ?? '',
        payments:              record.paidAmount > 0 ? String(record.paidAmount) : '',
        auth_status:           record.authStatus !== 'N/A' ? record.authStatus : '',
        referral_status:       record.referralStatus !== 'N/A' ? record.referralStatus : '',
        notes:                 record.notes ?? '',
        collected_amount:      record.collectedAmount !== null ? String(record.collectedAmount) : '',
        collected_method:      record.collectedMethod ?? '',
        collected_receipt_no:  record.collectedReceiptNo ?? '',
      });
    }
  }, [record?.id]);

  const handleClose = () => {
    reset();
    setStep(1);
    onClose();
  };

  const handleFinish = () => {
    if (!record) return;
    patch(`/appointments/${record.id}`, {
      onSuccess: () => handleClose(),
    });
  };

  if (!isOpen || !record) return null;

  const steps = [
    { id: 1, label: 'Eligibility', icon: User },
    { id: 2, label: 'Collect',    icon: DollarSign },
    { id: 3, label: 'Receipt',    icon: FileText },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-4xl overflow-hidden flex flex-col max-h-[90vh]">

        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center bg-gray-50">
          <div>
            <h3 className="text-lg font-bold text-gray-900">Update Record</h3>
            <p className="text-sm text-gray-500">Patient: {record.patient.name} (DOB: {record.patient.dob})</p>
          </div>
          <button onClick={handleClose} className="text-gray-400 hover:text-gray-600 transition-colors">
            <X size={24} />
          </button>
        </div>

        {/* Stepper */}
        <div className="px-6 py-4 border-b border-gray-100">
          <div className="flex items-center justify-center">
            {steps.map((s, idx) => (
              <React.Fragment key={s.id}>
                <div className="flex flex-col items-center relative z-10">
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center border-2 transition-colors duration-300 ${
                    step >= s.id ? 'bg-brand-600 border-brand-600 text-white' : 'bg-white border-gray-300 text-gray-400'
                  }`}>
                    <s.icon size={18} />
                  </div>
                  <span className={`text-xs font-semibold mt-1 ${step >= s.id ? 'text-brand-700' : 'text-gray-400'}`}>
                    {s.label}
                  </span>
                </div>
                {idx < steps.length - 1 && (
                  <div className={`h-0.5 w-24 mx-2 -mt-4 transition-colors duration-300 ${step > s.id ? 'bg-brand-600' : 'bg-gray-200'}`} />
                )}
              </React.Fragment>
            ))}
          </div>
        </div>

        {/* Body */}
        <div className="p-8 overflow-y-auto custom-scrollbar flex-1 bg-white">

          {/* ── Step 1: Eligibility ── */}
          {step === 1 && (
            <div className="space-y-6 animate-in slide-in-from-right-4 fade-in duration-300">
              <div className="grid grid-cols-2 gap-6">
                <div>
                  <label className={labelCls}>Provider Credentialed</label>
                  <select
                    value={data.provider_credentialed}
                    onChange={e => setData('provider_credentialed', e.target.value)}
                    className={inputCls}
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
                    onChange={e => setData('eligibility_status', e.target.value)}
                    className={inputCls}
                  >
                    <option value="">Choose Option</option>
                    <option>Eligible</option>
                    <option>Not Eligible</option>
                    <option>Verification Pending</option>
                  </select>
                </div>
                <div>
                  <label className={labelCls}>Collection Status</label>
                  <select
                    value={data.collection_status}
                    onChange={e => setData('collection_status', e.target.value)}
                    className={inputCls}
                  >
                    <option value="">Choose Option</option>
                    <option>Collected</option>
                    <option>Pending</option>
                    <option>Not Required</option>
                  </select>
                </div>
                <div>
                  <label className={labelCls}>Patient Balance Amount</label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <span className="text-gray-500 sm:text-sm">$</span>
                    </div>
                    <input
                      type="number"
                      min="0"
                      step="0.01"
                      value={data.payments}
                      onChange={e => setData('payments', e.target.value)}
                      className={`pl-7 ${inputCls}`}
                      placeholder="0.00"
                    />
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-6 pt-4 border-t border-gray-100">
                <div className="space-y-3">
                  <span className={labelCls}>Auth Required?</span>
                  <div className="flex gap-4">
                    {['Auth Required', 'N/A'].map(v => (
                      <label key={v} className="flex items-center cursor-pointer">
                        <input
                          type="radio"
                          name="auth"
                          checked={data.auth_status === v}
                          onChange={() => setData('auth_status', v)}
                          className="text-brand-600 focus:ring-brand-500"
                        />
                        <span className="ml-2 text-sm text-gray-600">{v === 'Auth Required' ? 'Yes' : 'No'}</span>
                      </label>
                    ))}
                  </div>
                </div>
                <div className="space-y-3">
                  <span className={labelCls}>Referral Required?</span>
                  <div className="flex gap-4">
                    {['Required', 'N/A'].map(v => (
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

              <div>
                <label className={labelCls}>Notes</label>
                <textarea
                  value={data.notes}
                  onChange={e => setData('notes', e.target.value)}
                  className={`${inputCls} resize-none`}
                  rows={3}
                  placeholder="Enter any additional details…"
                />
              </div>
            </div>
          )}

          {/* ── Step 2: Collect ── */}
          {step === 2 && (
            <div className="space-y-6 animate-in slide-in-from-right-4 fade-in duration-300">
              <div className="flex items-center gap-3 mb-2">
                <div className="p-2 bg-brand-50 rounded-lg text-brand-600">
                  <DollarSign size={24} />
                </div>
                <div>
                  <h4 className="text-base font-semibold text-gray-900">Payment Collection</h4>
                  <p className="text-sm text-gray-500">Record the payment received from the patient.</p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-6">
                <div>
                  <label className={labelCls}>Amount Collected</label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <span className="text-gray-500 sm:text-sm">$</span>
                    </div>
                    <input
                      type="number"
                      min="0"
                      step="0.01"
                      value={data.collected_amount}
                      onChange={e => setData('collected_amount', e.target.value)}
                      className={`pl-7 ${inputCls}`}
                      placeholder={data.payments || '0.00'}
                    />
                  </div>
                </div>
                <div>
                  <label className={labelCls}>Payment Method</label>
                  <select
                    value={data.collected_method}
                    onChange={e => setData('collected_method', e.target.value)}
                    className={inputCls}
                  >
                    <option value="">Choose Method</option>
                    <option>Cash</option>
                    <option>Credit Card</option>
                    <option>Check</option>
                    <option>Insurance</option>
                    <option>Other</option>
                  </select>
                </div>
                <div className="col-span-2">
                  <label className={labelCls}>Receipt No.</label>
                  <input
                    type="text"
                    value={data.collected_receipt_no}
                    onChange={e => setData('collected_receipt_no', e.target.value)}
                    className={inputCls}
                    placeholder="Enter receipt number…"
                  />
                </div>
              </div>
            </div>
          )}

          {/* ── Step 3: Receipt ── */}
          {step === 3 && (
            <div className="flex flex-col items-center justify-center h-full space-y-4 animate-in slide-in-from-right-4 fade-in duration-300 text-center py-8">
              <div className="p-4 bg-emerald-50 rounded-full text-emerald-600 mb-2">
                <CheckCircle2 size={48} />
              </div>
              <h4 className="text-xl font-semibold">Ready to Save</h4>
              <p className="text-gray-500 max-w-md">
                Review your entries, then click <strong>Finish</strong> to save all changes to the database.
              </p>
              <div className="text-left bg-gray-50 rounded-lg p-4 w-full max-w-sm space-y-1 text-sm">
                <div className="flex justify-between"><span className="text-gray-500">Eligibility:</span><span className="font-medium">{data.eligibility_status || '—'}</span></div>
                <div className="flex justify-between"><span className="text-gray-500">Collection:</span><span className="font-medium">{data.collection_status || '—'}</span></div>
                <div className="flex justify-between"><span className="text-gray-500">Balance:</span><span className="font-medium">{data.payments ? `$${data.payments}` : '—'}</span></div>
                {data.collected_amount && <div className="flex justify-between"><span className="text-gray-500">Collected:</span><span className="font-medium">${data.collected_amount} ({data.collected_method})</span></div>}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 bg-gray-50 border-t border-gray-200 flex justify-end gap-3">
          <button
            onClick={handleClose}
            className="px-5 py-2.5 rounded-lg border border-gray-300 text-gray-700 font-medium hover:bg-white hover:shadow-sm transition-all text-sm"
          >
            Cancel
          </button>

          {step < 3 ? (
            <button
              onClick={() => setStep(step + 1)}
              className="px-5 py-2.5 rounded-lg bg-brand-600 text-white font-medium hover:bg-brand-700 shadow-sm transition-all text-sm flex items-center gap-2"
            >
              Next <ChevronRight size={16} />
            </button>
          ) : (
            <button
              onClick={handleFinish}
              disabled={processing}
              className="px-5 py-2.5 rounded-lg bg-emerald-600 text-white font-medium hover:bg-emerald-700 shadow-sm transition-all text-sm flex items-center gap-2 disabled:opacity-60"
            >
              {processing ? <><Loader2 size={16} className="animate-spin" /> Saving…</> : 'Finish'}
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

// ════════════════════════════════════════════════════════════════════════════
// UpdatePSCModal
// ════════════════════════════════════════════════════════════════════════════
interface UpdatePSCModalProps {
  isOpen: boolean;
  onClose: () => void;
  record: Appointment | null;
}

export const UpdatePSCModal: React.FC<UpdatePSCModalProps> = ({ isOpen, onClose, record }) => {
  const { data, setData, patch, processing, reset } = useForm({
    psc_code:        '',
    psc_description: '',
  });

  useEffect(() => {
    if (record) {
      setData({
        psc_code:        record.pscCode ?? '',
        psc_description: record.pscDescription ?? '',
      });
    }
  }, [record?.id]);

  const handleClose = () => {
    reset();
    onClose();
  };

  const handleSave = () => {
    if (!record) return;
    patch(`/appointments/${record.id}/psc`, {
      onSuccess: () => handleClose(),
    });
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-md overflow-hidden">
        <div className="p-6 border-b border-gray-100 flex justify-between items-start">
          <div>
            <h3 className="text-lg font-bold text-gray-900">Update PSC</h3>
            <p className="text-sm text-gray-500 mt-1">Patient Service Center code for {record?.patient.name}.</p>
          </div>
          <button onClick={handleClose} className="text-gray-400 hover:text-gray-600">
            <X size={20} />
          </button>
        </div>

        <div className="p-6 space-y-4">
          <div>
            <label className={labelCls}>PSC Code</label>
            <select
              value={data.psc_code}
              onChange={e => setData('psc_code', e.target.value)}
              className={inputCls}
            >
              <option value="">Select code…</option>
              {PSC_CODES.map(code => (
                <option key={code}>{code}</option>
              ))}
            </select>
          </div>
          <div>
            <label className={labelCls}>Description / Notes</label>
            <input
              type="text"
              value={data.psc_description}
              onChange={e => setData('psc_description', e.target.value)}
              className={inputCls}
              placeholder="Enter additional notes…"
            />
          </div>
        </div>

        <div className="p-4 bg-gray-50 border-t border-gray-100 flex justify-end gap-3">
          <button onClick={handleClose} className="px-4 py-2 text-sm font-medium text-gray-600 hover:text-gray-800">
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={processing}
            className="px-4 py-2 text-sm font-medium bg-brand-600 text-white rounded-lg hover:bg-brand-700 shadow-sm flex items-center gap-2 disabled:opacity-60"
          >
            {processing ? <><Loader2 size={14} className="animate-spin" /> Saving…</> : 'Save Changes'}
          </button>
        </div>
      </div>
    </div>
  );
};
