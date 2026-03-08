import React from 'react';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

void React;

const mocks = vi.hoisted(() => ({
    push: vi.fn(),
    signIn: vi.fn(),
    signUp: vi.fn(),
    sendPasswordResetEmail: vi.fn(),
    submitNewPassword: vi.fn(),
    doesSessionExist: vi.fn()
}));

vi.mock('next/navigation', () => ({
    useRouter: () => ({ push: mocks.push })
}));

vi.mock('@opal/game/auth', () => ({
    EmailPassword: {
        signIn: mocks.signIn,
        signUp: mocks.signUp,
        sendPasswordResetEmail: mocks.sendPasswordResetEmail,
        submitNewPassword: mocks.submitNewPassword
    },
    Session: {
        doesSessionExist: mocks.doesSessionExist
    }
}));

import { AuthPage } from '../../apps/web/components/Auth/AuthPage.jsx';

function setValue(selector, value) {
    const element = document.querySelector(selector);
    Object.defineProperty(element, 'value', {
        configurable: true,
        writable: true,
        value
    });
    fireEvent(element, new Event('input', { bubbles: true }));
}

describe('AuthPage', () => {
    beforeEach(() => {
        mocks.push.mockReset();
        mocks.signIn.mockReset();
        mocks.signUp.mockReset();
        mocks.sendPasswordResetEmail.mockReset();
        mocks.submitNewPassword.mockReset();
        mocks.doesSessionExist.mockResolvedValue(false);
        window.history.replaceState({}, '', '/login');
    });

    it('signs users up from register mode', async () => {
        mocks.signUp.mockResolvedValue({ status: 'OK' });
        window.history.replaceState({}, '', '/login?mode=register&redirectTo=%2Fgame');

        render(<AuthPage />);
        await screen.findByText('Create account');

        setValue('[data-testid="username-input"]', 'player');
        setValue('[data-testid="email-input"]', 'player@example.com');
        setValue('[data-testid="password-input"]', 'secret123');
        fireEvent.submit(document.querySelector('form'));

        await waitFor(() => {
            expect(mocks.signUp).toHaveBeenCalledWith({
                formFields: [
                    { id: 'username', value: 'player' },
                    { id: 'email', value: 'player@example.com' },
                    { id: 'password', value: 'secret123' }
                ]
            });
        });
        expect(mocks.push).toHaveBeenCalledWith('/game');
    });

    it('renders navigation links for register and forgot-password modes', async () => {
        render(<AuthPage />);
        await screen.findByText('Sign in');

        expect(screen.getByText('Create account').closest('a')).toHaveAttribute('href', '/login?mode=register');
        expect(screen.getByText('Forgot password').closest('a')).toHaveAttribute('href', '/login?mode=forgot');
    });

    it('shows only the centered auth card layout', async () => {
        render(<AuthPage />);
        await screen.findByText('Sign in');

        expect(screen.queryByText('A reusable authenticated game base with clean defaults.')).not.toBeInTheDocument();
        expect(screen.getAllByText('Opal Game Studios Template Game')).toHaveLength(1);
    });

    it('shows a clear login error when credentials are wrong', async () => {
        mocks.signIn.mockResolvedValue({ status: 'WRONG_CREDENTIALS_ERROR' });

        render(<AuthPage />);
        await screen.findByText('Sign in');

        setValue('[data-testid="email-input"]', 'player@example.com');
        setValue('[data-testid="password-input"]', 'wrong-password');
        fireEvent.submit(document.querySelector('form'));

        expect(await screen.findByRole('alert')).toHaveTextContent(
            'That email and password combination did not match an account.'
        );
        expect(mocks.push).not.toHaveBeenCalled();
    });

    it('validates missing login fields before calling the auth API', async () => {
        render(<AuthPage />);
        await screen.findByText('Sign in');

        fireEvent.submit(document.querySelector('form'));

        expect(await screen.findByRole('alert')).toHaveTextContent('Enter your email address.');
        expect(mocks.signIn).not.toHaveBeenCalled();
    });

    it('sends password reset emails', async () => {
        mocks.sendPasswordResetEmail.mockResolvedValue({ status: 'OK' });
        window.history.replaceState({}, '', '/login?mode=forgot');

        render(<AuthPage />);
        await screen.findByText('Forgot password');
        setValue('[data-testid="email-input"]', 'player@example.com');
        fireEvent.submit(document.querySelector('form'));

        await waitFor(() => expect(mocks.sendPasswordResetEmail).toHaveBeenCalled());
        expect(screen.getByText('Password reset email sent.')).toBeInTheDocument();
    });

    it('submits a new password when a reset token is present', async () => {
        mocks.submitNewPassword.mockResolvedValue({ status: 'OK' });
        window.history.replaceState({}, '', '/auth/reset-password?token=reset-token');

        render(<AuthPage />);
        await screen.findByText('Reset password');

        setValue('[data-testid="password-input"]', 'new-secret');
        fireEvent.submit(document.querySelector('form'));

        await waitFor(() => {
            expect(mocks.submitNewPassword).toHaveBeenCalledWith({
                token: 'reset-token',
                formFields: [{ id: 'password', value: 'new-secret' }]
            });
        });
    });
});
