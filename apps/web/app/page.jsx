import React from 'react';
import { LandingActions } from '../components/Landing/LandingActions.jsx';
import { Logo } from '../components/Landing/Logo.jsx';

export default function HomePage() {
    return (
        <main className="min-h-screen bg-slate-50 px-6 py-10">
            <div className="mx-auto grid max-w-6xl gap-10 rounded-[2.5rem] border border-slate-200 bg-white p-10 shadow-[0_24px_80px_rgba(15,23,42,0.08)] lg:grid-cols-[0.9fr_1.1fr] lg:items-center lg:p-16">
                <div className="flex justify-center rounded-[2rem] border border-slate-200 bg-slate-50/80 p-8 text-blue-600">
                    <Logo className="h-44 w-44" />
                </div>
                <div>
                    <p className="text-sm font-semibold uppercase tracking-[0.25em] text-blue-600">Opal Game Studios</p>
                    <h1 className="mt-4 max-w-3xl text-5xl font-semibold tracking-tight text-slate-950">
                        Opal Game Studios Template Game
                    </h1>
                    <p className="mt-6 max-w-2xl text-lg leading-8 text-slate-600">
                        Start new game projects without re-deciding auth, infra, or quality gates. This template ships a light-themed authenticated game shell, backend persistence, Docker-first runtime, and strict lint/test expectations from day one.
                    </p>
                    <LandingActions />
                </div>
            </div>
        </main>
    );
}
