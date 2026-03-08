import React from 'react';
import { act, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

void React;

const mocks = vi.hoisted(() => ({
    push: vi.fn(),
    getAccessToken: vi.fn(),
    signOut: vi.fn(),
    initGame: vi.fn()
}));

vi.mock('next/navigation', () => ({
    useRouter: () => ({ push: mocks.push })
}));

vi.mock('@opal/game/auth', () => ({
    Session: {
        getAccessToken: mocks.getAccessToken,
        signOut: mocks.signOut
    }
}));

vi.mock('@opal/game/initGame', () => ({
    initGame: mocks.initGame
}));

import { GamePageClient } from '../../apps/web/components/Game/GamePageClient.jsx';

describe('GamePageClient', () => {
    beforeEach(() => {
        mocks.push.mockReset();
        mocks.getAccessToken.mockResolvedValue('token-1');
        mocks.signOut.mockResolvedValue(undefined);
        mocks.initGame.mockReset();
        global.fetch = vi.fn(async (url, options = {}) => {
            if (url === '/api/me') {
                return {
                    ok: true,
                    json: async () => ({ id: 1, username: 'player', sessionId: 'session-1' })
                };
            }
            if (url === '/api/game/state' && (!options.method || options.method === 'GET')) {
                return {
                    ok: true,
                    json: async () => ({ bestScore: 4, lastScore: 2 })
                };
            }
            if (url === '/api/game/state' && options.method === 'POST') {
                return {
                    ok: true,
                    json: async () => ({ bestScore: 5, lastScore: 5 })
                };
            }
            throw new Error(`Unexpected fetch ${url}`);
        });
    });

    it('loads player state, starts the game, persists score updates, and signs out', async () => {
        const controller = {
            restart: vi.fn(),
            destroy: vi.fn()
        };
        let initOptions = null;

        mocks.initGame.mockImplementation(async (options) => {
            initOptions = options;
            return controller;
        });

        render(<GamePageClient />);

        expect(await screen.findByText('player')).toBeInTheDocument();
        expect(screen.getByText('Best score')).toBeInTheDocument();
        expect(screen.getByText('Saved last score')).toBeInTheDocument();
        await waitFor(() => expect(mocks.initGame).toHaveBeenCalledTimes(1));
        expect(initOptions.container).toBeInstanceOf(HTMLElement);
        expect(initOptions.initialScore).toBe(2);

        await act(async () => {
            await initOptions.onScoreChange(5);
        });
        await waitFor(() => expect(screen.getAllByText('5').length).toBeGreaterThan(0));

        fireEvent.click(screen.getByText('Restart'));
        expect(controller.restart).toHaveBeenCalled();

        fireEvent.click(screen.getByText('Sign out'));
        await waitFor(() => expect(mocks.signOut).toHaveBeenCalled());
        expect(mocks.push).toHaveBeenCalledWith('/');
    });
});
