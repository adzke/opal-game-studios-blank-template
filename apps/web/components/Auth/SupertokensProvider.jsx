'use client';

import { useEffect, useState } from 'react';
import { initAuth } from '@opal/game/auth';
import '@opal/game/webawesome';

export function SupertokensProvider({ children }) {
    const [initialized, setInitialized] = useState(false);

    useEffect(() => {
        initAuth();
        setInitialized(true);
    }, []);

    if (!initialized) {
        return null;
    }

    return children;
}
