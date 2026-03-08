'use client';

import React, { useEffect, useRef } from 'react';

export function WaButton({ onPress, children, ...props }) {
    const ref = useRef(null);

    useEffect(() => {
        const element = ref.current;
        if (!element || !onPress) {
            return undefined;
        }

        const handler = (event) => {
            onPress(event);
        };

        element.addEventListener('click', handler);
        return () => {
            element.removeEventListener('click', handler);
        };
    }, [onPress]);

    return (
        <wa-button ref={ref} {...props}>
            {children}
        </wa-button>
    );
}
