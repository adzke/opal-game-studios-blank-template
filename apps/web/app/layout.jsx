import React from 'react';
import './globals.css';
import { SupertokensProvider } from '../components/Auth/SupertokensProvider.jsx';

export const metadata = {
    title: 'Opal Game Studios Template Game',
    description: 'A light-themed authenticated template game built with Next.js, Bun, Postgres, SuperTokens, Three.js, and Rapier.',
    icons: {
        icon: '/icon.svg'
    }
};

export default function RootLayout({ children }) {
    return (
        <html lang="en" className="bg-slate-50">
            <head>
                <script
                    dangerouslySetInnerHTML={{
                        __html: `window.__API_ORIGIN__ = ${JSON.stringify(process.env.NEXT_PUBLIC_API_ORIGIN || '')};`
                    }}
                />
            </head>
            <body className="bg-slate-50 text-slate-900">
                <SupertokensProvider>{children}</SupertokensProvider>
            </body>
        </html>
    );
}
