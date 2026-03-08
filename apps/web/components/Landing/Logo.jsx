import React from 'react';

export function Logo({ className = '' }) {
    const resolvedClassName = `h-40 w-40 ${className}`.trim();

    return (
        <svg
            viewBox="0 0 100 100"
            className={resolvedClassName}
            fill="none"
            stroke="url(#opal-logo-spectrum)"
            strokeWidth="3"
            strokeLinecap="round"
            strokeLinejoin="round"
            role="img"
            aria-label="Opal Game Studios logo"
        >
            <defs>
                <linearGradient id="opal-logo-spectrum" x1="10%" y1="0%" x2="90%" y2="100%">
                    <stop offset="0%" stopColor="#ef4444" />
                    <stop offset="18%" stopColor="#f97316" />
                    <stop offset="36%" stopColor="#facc15" />
                    <stop offset="54%" stopColor="#22c55e" />
                    <stop offset="72%" stopColor="#3b82f6" />
                    <stop offset="86%" stopColor="#6366f1" />
                    <stop offset="100%" stopColor="#a855f7" />
                </linearGradient>
            </defs>
            <path d="M50 5 L85 25 L85 75 L50 95 L15 75 L15 25 Z" />
            <path d="M50 5 L50 95" />
            <path d="M15 25 L85 25" />
            <path d="M15 75 L85 75" />
            <path d="M50 5 L85 75" />
            <path d="M50 5 L15 75" />
            <path d="M50 95 L15 25" />
            <path d="M50 95 L85 25" />
            <path d="M15 25 L50 50 L85 25" />
            <path d="M15 75 L50 50 L85 75" />
        </svg>
    );
}
