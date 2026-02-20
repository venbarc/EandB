import AuthLayout from '@/Components/AuthLayout';
import { Link, useForm } from '@inertiajs/react';
import { Eye, EyeOff } from 'lucide-react';
import { FormEvent, useState } from 'react';

export default function Register() {
    const [showPassword, setShowPassword] = useState(false);
    const [showPasswordConfirm, setShowPasswordConfirm] = useState(false);

    const { data, setData, post, processing, errors } = useForm({
        name: '',
        email: '',
        password: '',
        password_confirmation: '',
    });

    function handleSubmit(event: FormEvent<HTMLFormElement>) {
        event.preventDefault();
        post('/register');
    }

    return (
        <AuthLayout
            title="Register"
            heading="Create your account"
            subheading="Register and start tracking eligibility and benefits in one place."
            footer={
                <p>
                    Already have an account?{' '}
                    <Link href="/login" className="font-semibold text-cyan-300 hover:text-cyan-200">
                        Login
                    </Link>
                </p>
            }
        >
            <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                    <label htmlFor="name" className="mb-1.5 block text-sm font-medium text-slate-200">
                        Full name
                    </label>
                    <input
                        id="name"
                        type="text"
                        autoComplete="name"
                        value={data.name}
                        onChange={(event) => setData('name', event.target.value)}
                        className="w-full rounded-xl border border-white/20 bg-slate-900/70 px-3.5 py-2.5 text-sm text-slate-50 placeholder:text-slate-400 focus:border-cyan-300 focus:outline-none focus:ring-2 focus:ring-cyan-300/30"
                        placeholder="Juan Dela Cruz"
                    />
                    {errors.name && <p className="mt-1 text-xs text-red-300">{errors.name}</p>}
                </div>

                <div>
                    <label htmlFor="email" className="mb-1.5 block text-sm font-medium text-slate-200">
                        Email
                    </label>
                    <input
                        id="email"
                        type="email"
                        autoComplete="email"
                        value={data.email}
                        onChange={(event) => setData('email', event.target.value)}
                        className="w-full rounded-xl border border-white/20 bg-slate-900/70 px-3.5 py-2.5 text-sm text-slate-50 placeholder:text-slate-400 focus:border-cyan-300 focus:outline-none focus:ring-2 focus:ring-cyan-300/30"
                        placeholder="you@cfoutsourcing.com"
                    />
                    <p className="mt-1.5 text-xs text-slate-400">
                        Accepted domains: @cfoutsourcing.com · @cfstaffingsolutions.com
                    </p>
                    {errors.email && <p className="mt-1 text-xs text-red-300">{errors.email}</p>}
                </div>

                <div>
                    <label htmlFor="password" className="mb-1.5 block text-sm font-medium text-slate-200">
                        Password
                    </label>
                    <div className="relative">
                        <input
                            id="password"
                            type={showPassword ? 'text' : 'password'}
                            autoComplete="new-password"
                            value={data.password}
                            onChange={(event) => setData('password', event.target.value)}
                            className="w-full rounded-xl border border-white/20 bg-slate-900/70 px-3.5 py-2.5 pr-10 text-sm text-slate-50 placeholder:text-slate-400 focus:border-cyan-300 focus:outline-none focus:ring-2 focus:ring-cyan-300/30"
                            placeholder="Create password"
                        />
                        <button
                            type="button"
                            onClick={() => setShowPassword((value) => !value)}
                            className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-200"
                            tabIndex={-1}
                        >
                            {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                        </button>
                    </div>
                    {errors.password && <p className="mt-1 text-xs text-red-300">{errors.password}</p>}
                </div>

                <div>
                    <label htmlFor="password_confirmation" className="mb-1.5 block text-sm font-medium text-slate-200">
                        Confirm password
                    </label>
                    <div className="relative">
                        <input
                            id="password_confirmation"
                            type={showPasswordConfirm ? 'text' : 'password'}
                            autoComplete="new-password"
                            value={data.password_confirmation}
                            onChange={(event) => setData('password_confirmation', event.target.value)}
                            className="w-full rounded-xl border border-white/20 bg-slate-900/70 px-3.5 py-2.5 pr-10 text-sm text-slate-50 placeholder:text-slate-400 focus:border-cyan-300 focus:outline-none focus:ring-2 focus:ring-cyan-300/30"
                            placeholder="Repeat password"
                        />
                        <button
                            type="button"
                            onClick={() => setShowPasswordConfirm((value) => !value)}
                            className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-200"
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
                    {processing ? 'Creating account...' : 'Create account'}
                </button>
            </form>
        </AuthLayout>
    );
}
