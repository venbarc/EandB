import AuthLayout from '@/Components/AuthLayout';
import { Link, useForm } from '@inertiajs/react';
import { Eye, EyeOff } from 'lucide-react';
import { FormEvent, useState } from 'react';

interface ResetPasswordProps {
    token: string;
    email: string;
    status?: string;
}

export default function ResetPassword({ token, email, status }: ResetPasswordProps) {
    const [showPassword, setShowPassword] = useState(false);
    const [showPasswordConfirm, setShowPasswordConfirm] = useState(false);

    const { data, setData, post, processing, errors } = useForm({
        token,
        email: email ?? '',
        password: '',
        password_confirmation: '',
    });

    function handleSubmit(event: FormEvent<HTMLFormElement>) {
        event.preventDefault();
        post('/reset-password');
    }

    return (
        <AuthLayout
            title="Set New Password"
            heading="Create a new password"
            subheading="Use a strong password that you do not use elsewhere."
            footer={
                <p>
                    Remembered your password?{' '}
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
                        Email
                    </label>
                    <input
                        id="email"
                        type="email"
                        autoComplete="email"
                        value={data.email}
                        onChange={(event) => setData('email', event.target.value)}
                        className="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm text-slate-800 placeholder:text-slate-400 focus:border-teal-400 focus:outline-none focus:ring-2 focus:ring-teal-300/30"
                        placeholder="you@example.com"
                    />
                    {errors.email && <p className="mt-1 text-xs text-red-500">{errors.email}</p>}
                </div>

                <div>
                    <label htmlFor="password" className="mb-1.5 block text-sm font-medium text-slate-700">
                        New password
                    </label>
                    <div className="relative">
                        <input
                            id="password"
                            type={showPassword ? 'text' : 'password'}
                            autoComplete="new-password"
                            value={data.password}
                            onChange={(event) => setData('password', event.target.value)}
                            className="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 pr-10 text-sm text-slate-800 placeholder:text-slate-400 focus:border-teal-400 focus:outline-none focus:ring-2 focus:ring-teal-300/30"
                            placeholder="New password"
                        />
                        <button
                            type="button"
                            onClick={() => setShowPassword((value) => !value)}
                            className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700"
                            tabIndex={-1}
                        >
                            {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                        </button>
                    </div>
                    {errors.password && <p className="mt-1 text-xs text-red-500">{errors.password}</p>}
                </div>

                <div>
                    <label htmlFor="password_confirmation" className="mb-1.5 block text-sm font-medium text-slate-700">
                        Confirm new password
                    </label>
                    <div className="relative">
                        <input
                            id="password_confirmation"
                            type={showPasswordConfirm ? 'text' : 'password'}
                            autoComplete="new-password"
                            value={data.password_confirmation}
                            onChange={(event) => setData('password_confirmation', event.target.value)}
                            className="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 pr-10 text-sm text-slate-800 placeholder:text-slate-400 focus:border-teal-400 focus:outline-none focus:ring-2 focus:ring-teal-300/30"
                            placeholder="Confirm new password"
                        />
                        <button
                            type="button"
                            onClick={() => setShowPasswordConfirm((value) => !value)}
                            className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700"
                            tabIndex={-1}
                        >
                            {showPasswordConfirm ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                        </button>
                    </div>
                </div>

                <button
                    type="submit"
                    disabled={processing}
                    className="w-full rounded-xl bg-cyan-400 px-4 py-2.5 text-sm font-semibold text-slate-900 transition hover:bg-cyan-300 disabled:cursor-not-allowed disabled:opacity-60"
                >
                    {processing ? 'Resetting password...' : 'Reset password'}
                </button>
            </form>
        </AuthLayout>
    );
}
