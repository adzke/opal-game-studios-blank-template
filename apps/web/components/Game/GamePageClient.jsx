'use client';

import React, { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Session } from '@opal/game/auth';
import { WaButton } from '../WebAwesome/WaButton.jsx';

async function fetchJson(path, options = {}) {
    const token = await Session.getAccessToken();
    const response = await fetch(path, {
        ...options,
        headers: {
            'Content-Type': 'application/json',
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
            ...(options.headers || {})
        }
    });

    const body = await response.json();
    if (!response.ok) {
        throw new Error(body.error || 'Request failed');
    }

    return body;
}

export function GamePageClient() {
    const router = useRouter();
    const containerRef = useRef(null);
    const controllerRef = useRef(null);
    const [loading, setLoading] = useState(true);
    const [gameBoot, setGameBoot] = useState(null);
    const [user, setUser] = useState(null);
    const [currentScore, setCurrentScore] = useState(0);
    const [bestScore, setBestScore] = useState(0);
    const [savedLastScore, setSavedLastScore] = useState(0);
    const [status, setStatus] = useState('');

    useEffect(() => {
        let active = true;

        async function setupGame() {
            try {
                const [me, gameState] = await Promise.all([
                    fetchJson('/api/me'),
                    fetchJson('/api/game/state')
                ]);

                if (!active) {
                    return;
                }

                setUser(me);
                setBestScore(gameState.bestScore);
                setSavedLastScore(gameState.lastScore);
                setCurrentScore(gameState.lastScore);
                setGameBoot({
                    initialScore: gameState.lastScore
                });
            } catch (setupError) {
                setStatus(setupError.message);
            } finally {
                if (active) {
                    setLoading(false);
                }
            }
        }

        void setupGame();

        return () => {
            active = false;
        };
    }, []);

    useEffect(() => {
        let active = true;

        async function mountGame() {
            if (loading || !gameBoot || !containerRef.current || controllerRef.current) {
                return;
            }

            try {
                const { initGame } = await import('@opal/game/initGame');
                const controller = await initGame({
                    container: containerRef.current,
                    initialScore: gameBoot.initialScore,
                    onScoreChange: async (nextScore) => {
                        try {
                            setCurrentScore(nextScore);
                            const persisted = await fetchJson('/api/game/state', {
                                method: 'POST',
                                body: JSON.stringify({ score: nextScore })
                            });
                            setBestScore(persisted.bestScore);
                            setSavedLastScore(persisted.lastScore);
                            setStatus('');
                        } catch (persistError) {
                            setStatus(persistError.message);
                        }
                    },
                    onStateChange: ({ score }) => {
                        setCurrentScore(score);
                    }
                });

                if (!active) {
                    controller.destroy();
                    return;
                }

                controllerRef.current = controller;
            } catch (setupError) {
                if (active) {
                    setStatus(setupError.message);
                }
            }
        }

        void mountGame();

        return () => {
            active = false;
            controllerRef.current?.destroy();
            controllerRef.current = null;
        };
    }, [gameBoot, loading]);

    async function handleSignOut() {
        await Session.signOut();
        router.push('/');
    }

    function handleRestart() {
        controllerRef.current?.restart();
        setCurrentScore(0);
        setStatus('Live score restarted.');
    }

    if (loading) {
        return <div className="flex min-h-screen items-center justify-center text-slate-500">Loading game...</div>;
    }

    return (
        <main className="min-h-screen bg-slate-50 px-6 py-8">
            <div className="mx-auto grid max-w-7xl gap-6 xl:grid-cols-[1.35fr_0.65fr]">
                <section className="space-y-4">
                    <div className="flex flex-wrap items-center justify-between gap-3 rounded-3xl border border-slate-200 bg-white px-5 py-4 shadow-sm">
                        <div>
                            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-slate-500">Authenticated Player</p>
                            <p className="text-lg font-semibold text-slate-900">{user?.username || 'Player'}</p>
                        </div>
                        <div className="flex gap-3">
                            <WaButton appearance="outlined" onPress={handleRestart}>Restart</WaButton>
                            <WaButton appearance="outlined" onPress={handleSignOut}>Sign out</WaButton>
                        </div>
                    </div>

                    <div ref={containerRef} className="starter-game-shell" id="game-container" />
                </section>

                <aside className="space-y-4 rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
                    <div>
                        <p className="text-xs font-semibold uppercase tracking-[0.22em] text-slate-500">Current score</p>
                        <p className="mt-1 text-4xl font-semibold text-slate-950">{currentScore}</p>
                    </div>
                    <div>
                        <p className="text-xs font-semibold uppercase tracking-[0.22em] text-slate-500">Best score</p>
                        <p className="mt-1 text-3xl font-semibold text-blue-600">{bestScore}</p>
                    </div>
                    <div>
                        <p className="text-xs font-semibold uppercase tracking-[0.22em] text-slate-500">Saved last score</p>
                        <p className="mt-1 text-2xl font-semibold text-slate-700">{savedLastScore}</p>
                    </div>
                    <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4 text-sm text-slate-600">
                        Move with arrow keys or WASD on desktop. Use the virtual joystick on touch devices. Collect the blue target to increase your score.
                    </div>
                    {status ? <p className="text-sm text-slate-500">{status}</p> : null}
                </aside>
            </div>
        </main>
    );
}
