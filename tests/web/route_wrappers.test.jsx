import React from 'react';
import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

void React;

vi.mock('../../apps/web/components/Auth/AuthPage.jsx', () => ({
    AuthPage: () => <div>Auth Page Mock</div>
}));

vi.mock('../../apps/web/components/Auth/AuthGuard.jsx', () => ({
    AuthGuard: ({ children }) => <div>{children}</div>
}));

vi.mock('../../apps/web/components/Game/GamePageClient.jsx', () => ({
    GamePageClient: () => <div>Game Client Mock</div>
}));

vi.mock('../../apps/web/components/Landing/LandingActions.jsx', () => ({
    LandingActions: () => <div>Landing Actions Mock</div>
}));

import HomePage from '../../apps/web/app/page.jsx';
import LoginPage from '../../apps/web/app/login/page.jsx';
import ResetPasswordPage from '../../apps/web/app/auth/reset-password/page.jsx';
import ProtectedLayout from '../../apps/web/app/(protected)/layout.jsx';
import GamePage from '../../apps/web/app/(protected)/game/page.jsx';

describe('route wrappers', () => {
    it('renders the landing page shell', () => {
        render(<HomePage />);
        expect(screen.getByText('Landing Actions Mock')).toBeInTheDocument();
        expect(screen.getByText('Opal Game Studios Template Game')).toBeInTheDocument();
        expect(screen.getByLabelText('Opal Game Studios logo')).toBeInTheDocument();
    });

    it('renders auth page wrappers and the protected game route', () => {
        render(<LoginPage />);
        render(<ResetPasswordPage />);
        render(<ProtectedLayout><div>Protected Child</div></ProtectedLayout>);
        render(<GamePage />);

        expect(screen.getAllByText('Auth Page Mock')).toHaveLength(2);
        expect(screen.getByText('Protected Child')).toBeInTheDocument();
        expect(screen.getByText('Game Client Mock')).toBeInTheDocument();
    });
});
