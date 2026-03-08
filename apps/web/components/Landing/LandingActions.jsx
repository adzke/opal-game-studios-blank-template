'use client';

import React, { useEffect, useState } from 'react';
import { Session } from '@opal/game/auth';

export function LandingActions() {
    const [authenticated, setAuthenticated] = useState(false);

    useEffect(() => {
        let active = true;

        async function loadSession() {
            const exists = await Session.doesSessionExist();
            if (active) {
                setAuthenticated(exists);
            }
        }

        void loadSession();

        return () => {
            active = false;
        };
    }, []);

    return (
        <div className="mt-8 flex flex-wrap gap-4">
            <a href="/login">
                <wa-button appearance="filled" variant="brand">Sign in</wa-button>
            </a>
            <a href="/login?mode=register">
                <wa-button appearance="outlined">Create account</wa-button>
            </a>
            {authenticated ? (
                <a href="/game">
                    <wa-button appearance="outlined">Go to game</wa-button>
                </a>
            ) : null}
        </div>
    );
}
