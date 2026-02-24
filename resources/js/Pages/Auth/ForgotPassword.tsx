import AuthLayout from '@/Components/AuthLayout';
import { Link, useForm } from '@inertiajs/react';
import { FormEvent } from 'react';

interface ForgotPasswordProps {
    status?: string;
}

export default function ForgotPassword({ status }: ForgotPasswordProps) {
    const { data, setData, post, processing, errors } = useForm({
        email: '',
    });

    function handleSubmit(event: FormEvent<HTMLFormElement>) {
        event.preventDefault();
        post('/forgot-password');
    }

    return (
        <AuthLayout
            title="Forgot Password"
            heading="Reset password"
            subheading="Enter your registered email and we will send a reset link."
            footer={
                <p>
                    Back to{' '}
                    <Link href="/login" className="font-semibold text-teal-600 hover:text-teal-500">
                        Login
                    </Link>
                </p>
            }
        >
            {status && (
                <div className="mb-5 rounded-xl border border-emerald-400/40 bg-emerald-50 px-4 py-2 text-sm text-emerald-700">
                    {status}
                </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                    <label htmlFor="email" className="mb-1.5 block text-sm font-medium text-slate-700">
                        Registered email
                    </label>
                    <input
                        id="email"
                        type="email"
                        autoComplete="email"
                        autoFocus
                        value={data.email}
                        onChange={(event) => setData('email', event.target.value)}
                        className="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm text-slate-800 placeholder:text-slate-400 focus:border-teal-400 focus:outline-none focus:ring-2 focus:ring-teal-300/30"
                        placeholder="you@example.com"
                    />
                    {errors.email && <p className="mt-1 text-xs text-red-500">{errors.email}</p>}
                </div>

                <button
                    type="submit"
                    disabled={processing}
                    className="w-full rounded-xl bg-cyan-400 px-4 py-2.5 text-sm font-semibold text-slate-900 transition hover:bg-cyan-300 disabled:cursor-not-allowed disabled:opacity-60"
                >
                    {processing ? 'Sending reset link...' : 'Send reset link'}
                </button>
            </form>
        </AuthLayout>
    );
}
