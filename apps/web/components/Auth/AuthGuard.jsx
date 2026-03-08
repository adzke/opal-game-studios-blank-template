'use client';

import React, { useEffect, useState } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { Session } from '@opal/game/auth';

export function AuthGuard({ children }) {
    const router = useRouter();
    const pathname = usePathname();
    const [authorized, setAuthorized] = useState(false);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        let active = true;

        async function checkSession() {
            try {
                const exists = await Session.doesSessionExist();
                if (!exists) {
                    router.push(`/login?redirectTo=${encodeURIComponent(pathname)}`);
                    return;
                }

                if (active) {
                    setAuthorized(true);
                }
            } catch (_error) {
                router.push('/login');
            } finally {
                if (active) {
                    setLoading(false);
                }
            }
        }

        void checkSession();

        return () => {
            active = false;
        };
    }, [pathname, router]);

    if (loading) {
        return <div className="flex min-h-screen items-center justify-center text-slate-500">Checking session...</div>;
    }

    if (!authorized) {
        return null;
    }

    return children;
}
