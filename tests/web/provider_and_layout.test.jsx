import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

void React;

const authMocks = vi.hoisted(() => ({
    initAuth: vi.fn()
}));

vi.mock('@opal/game/auth', () => ({
    initAuth: authMocks.initAuth
}));

vi.mock('@opal/game/webawesome', () => ({}));

import { SupertokensProvider } from '../../apps/web/components/Auth/SupertokensProvider.jsx';
import RootLayout, { metadata } from '../../apps/web/app/layout.jsx';

describe('SupertokensProvider and RootLayout', () => {
    beforeEach(() => {
        authMocks.initAuth.mockClear();
    });

    it('initializes auth and renders children after setup', async () => {
        render(
            <SupertokensProvider>
                <div>child</div>
            </SupertokensProvider>
        );

        await waitFor(() => expect(authMocks.initAuth).toHaveBeenCalled());
        expect(screen.getByText('child')).toBeInTheDocument();
    });

    it('defines metadata and light layout structure', () => {
        const element = RootLayout({ children: <span>content</span> });

        expect(metadata.title).toContain('Opal Game Studios Template Game');
        expect(metadata.icons).toMatchObject({
            icon: '/icon.svg'
        });
        expect(element.type).toBe('html');
        expect(element.props.children[1].type).toBe('body');
    });
});
