import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

void React;

const mocks = vi.hoisted(() => ({
    push: vi.fn(),
    doesSessionExist: vi.fn()
}));

vi.mock('next/navigation', () => ({
    useRouter: () => ({ push: mocks.push }),
    usePathname: () => '/game'
}));

vi.mock('@opal/game/auth', () => ({
    Session: {
        doesSessionExist: mocks.doesSessionExist
    }
}));

import { AuthGuard } from '../../apps/web/components/Auth/AuthGuard.jsx';
import { LandingActions } from '../../apps/web/components/Landing/LandingActions.jsx';

describe('AuthGuard and LandingActions', () => {
    beforeEach(() => {
        mocks.push.mockReset();
        mocks.doesSessionExist.mockReset();
    });

    it('redirects unauthenticated users from protected routes', async () => {
        mocks.doesSessionExist.mockResolvedValue(false);

        render(
            <AuthGuard>
                <div>secret</div>
            </AuthGuard>
        );

        await waitFor(() => {
            expect(mocks.push).toHaveBeenCalledWith('/login?redirectTo=%2Fgame');
        });
    });

    it('renders protected content when a session exists', async () => {
        mocks.doesSessionExist.mockResolvedValue(true);

        render(
            <AuthGuard>
                <div>secret</div>
            </AuthGuard>
        );

        expect(await screen.findByText('secret')).toBeInTheDocument();
    });

    it('shows go-to-game only when already authenticated', async () => {
        mocks.doesSessionExist.mockResolvedValue(true);

        render(<LandingActions />);

        expect(await screen.findByText('Go to game')).toBeInTheDocument();
        expect(screen.getByText('Sign in').closest('a')).toHaveAttribute('href', '/login');
        expect(screen.getByText('Go to game').closest('a')).toHaveAttribute('href', '/game');
    });
});
