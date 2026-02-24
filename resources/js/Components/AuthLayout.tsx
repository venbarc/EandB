import { Head, Link } from '@inertiajs/react';
import { Activity, ShieldCheck } from 'lucide-react';
import type { ReactNode } from 'react';

interface AuthLayoutProps {
    title: string;
    heading: string;
    subheading: string;
    children: ReactNode;
    footer: ReactNode;
}

export default function AuthLayout({ title, heading, subheading, children, footer }: AuthLayoutProps) {
    return (
        <>
            <Head title={title} />

            <div className="relative min-h-screen overflow-hidden bg-gradient-to-br from-slate-50 via-white to-teal-50 text-slate-800">
                <div className="auth-blob absolute -left-20 top-16 h-72 w-72 rounded-full bg-teal-200/40 blur-3xl" />
                <div className="auth-blob absolute bottom-8 right-2 h-80 w-80 rounded-full bg-cyan-200/30 blur-3xl [animation-delay:-4s]" />

                <main className="relative mx-auto flex min-h-screen w-full max-w-6xl items-center px-4 py-10 sm:px-6 lg:px-8">
                    <div className="grid w-full gap-8 lg:grid-cols-[1.1fr_1fr]">
                        <section className="auth-card hidden rounded-3xl border border-slate-200/80 bg-white/70 p-10 backdrop-blur-xl lg:flex lg:flex-col lg:justify-between">
                            <div>
                                <p className="text-xs font-semibold uppercase tracking-[0.24em] text-teal-600">
                                    CF-Outsourcing Platform
                                </p>
                                <h1 className="mt-5 text-4xl font-semibold leading-tight text-slate-800">
                                    Eligibility &amp; Benefits Dashboard
                                </h1>
                                <p className="mt-4 max-w-md text-sm leading-7 text-slate-500">
                                    Faster insurance verification, cleaner scheduling, and a focused workflow for your team.
                                </p>
                            </div>

                            <div className="grid gap-3">
                                <div className="rounded-2xl border border-slate-200 bg-white/60 p-4">
                                    <p className="flex items-center gap-2 text-sm font-medium text-slate-700">
                                        <ShieldCheck className="h-4 w-4 text-teal-500" />
                                        Secure role-based access
                                    </p>
                                </div>
                                <div className="rounded-2xl border border-slate-200 bg-white/60 p-4">
                                    <p className="flex items-center gap-2 text-sm font-medium text-slate-700">
                                        <Activity className="h-4 w-4 text-teal-500" />
                                        Live claims and appointment visibility
                                    </p>
                                </div>
                            </div>
                        </section>

                        <section className="auth-card auth-card-delay rounded-3xl border border-slate-200 bg-white/90 p-7 shadow-[0_8px_40px_-12px_rgba(20,184,166,0.18)] backdrop-blur-xl sm:p-10">
                            <div>
                                <Link href="/login" className="inline-flex items-center gap-2 text-teal-700">
                                    <div className="rounded-lg border border-teal-200 bg-teal-50 px-2.5 py-1 text-sm font-semibold">
                                        CF-Outsourcing
                                    </div>
                                </Link>
                                <h2 className="mt-5 text-3xl font-semibold text-slate-800">{heading}</h2>
                                <p className="mt-2 text-sm text-slate-500">{subheading}</p>
                            </div>

                            <div className="mt-8">{children}</div>

                            <div className="mt-8 border-t border-slate-200 pt-5 text-sm text-slate-500">{footer}</div>
                        </section>
                    </div>
                </main>
            </div>
        </>
    );
}
