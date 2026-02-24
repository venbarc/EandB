import React, { useEffect } from 'react';
import { useForm } from '@inertiajs/react';
import { X, User, Loader2 } from 'lucide-react';
import { Appointment } from '@/types';

const inputCls =
  'w-full border-gray-300 rounded-lg shadow-sm focus:ring-brand-500 focus:border-brand-500 p-2.5 bg-gray-50 border text-sm text-gray-900 placeholder:text-gray-400';
const labelCls = 'block text-sm font-medium text-gray-700 mb-1';

const PSC_CODES = [
  'Eligibility Completed',
  'Eligibility Not Found',
  'No Collection Required',
  'Provider Not Credentialed',
  'Payment Completed',
  'Self Pay',
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
    insurance_type: '' as string,
    payments: '' as string,
    auth_status: '' as string,
    referral_status: '' as string,
    notes: '' as string,
    collected_amount: '' as string,
    collected_method: '' as string,
    collected_receipt_no: '' as string,
    submitted: false as boolean,
  });
  const [activeAction, setActiveAction] = React.useState<'save' | 'toggle' | null>(null);

  useEffect(() => {
    if (!record) return;

    setData({
      provider_credentialed:
        record.providerCredentialed === true ? 'Yes' : record.providerCredentialed === false ? 'No' : '',
      eligibility_status: record.eligibilityStatus !== 'Verification Needed' ? record.eligibilityStatus : '',
      collection_status: record.collectionStatus ?? '',
      insurance_type: record.insuranceType ?? '',
      payments: record.paidAmount > 0 ? String(record.paidAmount) : '',
      auth_status: record.authStatus !== 'N/A' ? record.authStatus : '',
      referral_status: record.referralStatus !== 'N/A' ? record.referralStatus : '',
      notes: record.notes ?? '',
      collected_amount: record.collectedAmount !== null ? String(record.collectedAmount) : '',
      collected_method: record.collectedMethod ?? '',
      collected_receipt_no: record.collectedReceiptNo ?? '',
      submitted: record.isSubmittedToPaDept,
    });
  }, [record?.id]);

  const handleClose = () => {
    reset();
    setActiveAction(null);
    onClose();
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
                  <option>Eligible</option>
                  <option>Not Eligible</option>
                  <option>Verification Pending</option>
                </select>
              </div>
              <div>
                <label className={labelCls}>Collection Status</label>
                <select
                  value={data.collection_status}
                  onChange={(e) => setData('collection_status', e.target.value)}
                  className={`${inputCls} modal-select`}
                >
                  <option value="">Choose Option</option>
                  <option>Collected</option>
                  <option>Pending</option>
                  <option>Not Required</option>
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
                    onChange={(e) => setData('payments', e.target.value)}
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
                  {[{ value: 'Auth Required', label: 'Yes' }, { value: 'N/A', label: 'No' }, { value: 'Active', label: 'Active' }].map(({ value: v, label }) => (
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

interface UpdatePSCModalProps {
  isOpen: boolean;
  onClose: () => void;
  record: Appointment | null;
}

export const UpdatePSCModal: React.FC<UpdatePSCModalProps> = ({ isOpen, onClose, record }) => {
  const { data, setData, patch, processing, reset } = useForm({
    psc_code: '',
    psc_description: '',
  });

  useEffect(() => {
    if (!record) return;
    setData({
      psc_code: record.pscCode ?? '',
      psc_description: record.pscDescription ?? '',
    });
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
              onChange={(e) => setData('psc_code', e.target.value)}
              className={`${inputCls} modal-select`}
            >
              <option value="">Select code...</option>
              {PSC_CODES.map((code) => (
                <option key={code}>{code}</option>
              ))}
            </select>
          </div>
          <div>
            <label className={labelCls}>Description / Notes</label>
            <input
              type="text"
              value={data.psc_description}
              onChange={(e) => setData('psc_description', e.target.value)}
              className={inputCls}
              placeholder="Enter additional notes..."
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
            {processing ? (
              <>
                <Loader2 size={14} className="animate-spin" /> Saving...
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
