'use client';

import React, { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { EmailPassword, Session } from '@opal/game/auth';
import { WaButton } from '../WebAwesome/WaButton.jsx';

const MODE_COPY = {
    login: 'Sign in',
    register: 'Create account',
    forgot: 'Forgot password',
    reset: 'Reset password'
};
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const FIELD_LABELS = {
    email: 'email address',
    password: 'password',
    username: 'username'
};
const AUTH_RESPONSE_MESSAGES = {
    WRONG_CREDENTIALS_ERROR: 'That email and password combination did not match an account.',
    RESET_PASSWORD_INVALID_TOKEN_ERROR: 'This reset link is invalid or has expired. Request a new password reset email.',
    EMAIL_ALREADY_EXISTS_ERROR: 'An account already exists for that email address. Sign in instead.'
};
const RESTRICTED_AUTH_RESPONSE_STATUSES = new Set([
    'SIGN_IN_NOT_ALLOWED',
    'SIGN_UP_NOT_ALLOWED',
    'PASSWORD_RESET_NOT_ALLOWED'
]);

function readValue(ref) {
    return ref.current?.value?.trim?.() ?? '';
}

function resolveModeFromSearch(search) {
    const params = new URLSearchParams(search);
    if (params.get('token')) {
        return 'reset';
    }
    if (params.get('mode') === 'register' || params.get('mode') === 'forgot') {
        return params.get('mode');
    }
    return 'login';
}

function ensureSentence(message, fallback) {
    if (typeof message !== 'string' || !message.trim()) {
        return fallback;
    }

    return `${message.trim().replace(/[.!?]+$/u, '')}.`;
}

function describeFieldError(field) {
    const fieldLabel = FIELD_LABELS[field?.id] || 'details';
    const fieldError = typeof field?.error === 'string' ? field.error.trim() : '';

    if (!fieldError) {
        return `Check your ${fieldLabel}.`;
    }

    if (/field is not optional/i.test(fieldError) || /is required/i.test(fieldError)) {
        return `Enter your ${fieldLabel}.`;
    }

    if (/email/i.test(fieldError) && /valid|invalid/i.test(fieldError)) {
        return 'Enter a valid email address.';
    }

    return ensureSentence(fieldError, `Check your ${fieldLabel}.`);
}

function describeFormFieldErrors(response) {
    if (response.status !== 'FIELD_ERROR' || !Array.isArray(response.formFields) || response.formFields.length === 0) {
        return '';
    }

    return response.formFields.map((field) => describeFieldError(field)).join(' ');
}

function describeAuthResponseError(response, fallback, restrictedFallback) {
    if (!response || typeof response !== 'object') {
        return fallback;
    }

    const formFieldErrors = describeFormFieldErrors(response);
    if (formFieldErrors) {
        return formFieldErrors;
    }

    if (AUTH_RESPONSE_MESSAGES[response.status]) {
        return AUTH_RESPONSE_MESSAGES[response.status];
    }

    if (RESTRICTED_AUTH_RESPONSE_STATUSES.has(response.status)) {
        return restrictedFallback;
    }

    return fallback;
}

function validateEmailAddress(email) {
    if (!email) {
        return 'Enter your email address.';
    }

    if (!EMAIL_PATTERN.test(email)) {
        return 'Enter a valid email address.';
    }

    return '';
}

function validateRequiredValue(value, message) {
    return value ? '' : message;
}

const SUBMISSION_VALIDATORS = {
    login: [
        ({ email }) => validateEmailAddress(email),
        ({ password }) => validateRequiredValue(password, 'Enter your password.')
    ],
    register: [
        ({ username }) => validateRequiredValue(username, 'Enter a username.'),
        ({ email }) => validateEmailAddress(email),
        ({ password }) => validateRequiredValue(password, 'Enter a password.')
    ],
    forgot: [
        ({ email }) => validateEmailAddress(email)
    ],
    reset: [
        ({ token }) => validateRequiredValue(token, 'This reset link is invalid or incomplete. Request a new password reset email.'),
        ({ password }) => validateRequiredValue(password, 'Enter a new password.')
    ]
};

function validateSubmission({ mode, email, password, username, token }) {
    const validators = SUBMISSION_VALIDATORS[mode] || [];

    for (const validate of validators) {
        const error = validate({ email, password, username, token });
        if (error) {
            return error;
        }
    }

    return '';
}

async function submitLogin({ email, password, redirectTo, router }) {
    let response;

    try {
        response = await EmailPassword.signIn({
            formFields: [
                { id: 'email', value: email },
                { id: 'password', value: password }
            ]
        });
    } catch (_error) {
        throw new Error('We could not reach the sign in service. Please try again.');
    }

    if (response.status !== 'OK') {
        throw new Error(
            describeAuthResponseError(
                response,
                'We could not sign you in right now. Please try again.',
                'Sign in is currently unavailable for this account.'
            )
        );
    }

    router.push(redirectTo);
    return null;
}

async function submitRegister({ username, email, password, redirectTo, router }) {
    let response;

    try {
        response = await EmailPassword.signUp({
            formFields: [
                { id: 'username', value: username },
                { id: 'email', value: email },
                { id: 'password', value: password }
            ]
        });
    } catch (_error) {
        throw new Error('We could not reach the account service. Please try again.');
    }

    if (response.status !== 'OK') {
        throw new Error(
            describeAuthResponseError(
                response,
                'We could not create your account right now. Please try again.',
                'Account creation is currently unavailable.'
            )
        );
    }

    router.push(redirectTo);
    return null;
}

async function submitForgotPassword({ email }) {
    let response;

    try {
        response = await EmailPassword.sendPasswordResetEmail({
            formFields: [
                { id: 'email', value: email }
            ]
        });
    } catch (_error) {
        throw new Error('We could not reach the password reset service. Please try again.');
    }

    if (response.status !== 'OK') {
        throw new Error(
            describeAuthResponseError(
                response,
                'We could not send a password reset email right now. Please try again.',
                'Password reset is currently unavailable.'
            )
        );
    }

    return 'Password reset email sent.';
}

async function submitResetPassword({ password, token }) {
    let response;

    try {
        response = await EmailPassword.submitNewPassword({
            token,
            formFields: [
                { id: 'password', value: password }
            ]
        });
    } catch (_error) {
        throw new Error('We could not update your password right now. Please try again.');
    }

    if (response.status !== 'OK') {
        throw new Error(
            describeAuthResponseError(
                response,
                'We could not update your password right now. Please try again.',
                'Password reset is currently unavailable.'
            )
        );
    }

    window.history.replaceState({}, document.title, '/login');
    return 'Password updated. Sign in with your new password.';
}

function renderFormFields({ mode, emailRef, passwordRef, usernameRef }) {
    return (
        <>
            {mode === 'register' ? (
                <wa-input
                    ref={usernameRef}
                    data-testid="username-input"
                    name="username"
                    label="Username"
                    placeholder="player-one"
                />
            ) : null}

            {mode !== 'reset' ? (
                <wa-input
                    ref={emailRef}
                    data-testid="email-input"
                    name="email"
                    type="email"
                    label="Email"
                    placeholder="player@example.com"
                />
            ) : null}

            {mode !== 'forgot' ? (
                <wa-input
                    ref={passwordRef}
                    data-testid="password-input"
                    name="password"
                    type="password"
                    label={mode === 'reset' ? 'New password' : 'Password'}
                    placeholder="Enter your password"
                />
            ) : null}
        </>
    );
}

export function AuthPage() {
    const router = useRouter();
    const formRef = useRef(null);
    const emailRef = useRef(null);
    const passwordRef = useRef(null);
    const usernameRef = useRef(null);
    const [mode, setMode] = useState('login');
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');

    useEffect(() => {
        let active = true;

        async function primePage() {
            setMode(resolveModeFromSearch(window.location.search));

            if (await Session.doesSessionExist()) {
                router.push('/game');
                return;
            }

            if (active) {
                setLoading(false);
            }
        }

        void primePage();

        return () => {
            active = false;
        };
    }, [router]);

    async function handleSubmit(event) {
        event.preventDefault();
        setError('');
        setSuccess('');

        const email = readValue(emailRef);
        const password = readValue(passwordRef);
        const username = readValue(usernameRef);
        const params = new URLSearchParams(window.location.search);
        const token = params.get('token') || '';
        const redirectTo = params.get('redirectTo') || '/game';
        const validationError = validateSubmission({
            mode,
            email,
            password,
            username,
            token
        });

        if (validationError) {
            setError(validationError);
            return;
        }

        setSubmitting(true);
        const submitMap = {
            login: () => submitLogin({ email, password, redirectTo, router }),
            register: () => submitRegister({ username, email, password, redirectTo, router }),
            forgot: () => submitForgotPassword({ email }),
            reset: () => submitResetPassword({ password, token })
        };

        try {
            const message = await submitMap[mode]();
            if (mode === 'reset') {
                setMode('login');
            }
            if (message) {
                setSuccess(message);
            }
        } catch (submissionError) {
            setError(submissionError.message || 'Unable to complete that request.');
        } finally {
            setSubmitting(false);
        }
    }

    if (loading) {
        return <div className="flex min-h-screen items-center justify-center text-slate-500">Loading auth...</div>;
    }

    return (
        <main className="min-h-screen bg-slate-50 px-6 py-10">
            <div className="mx-auto flex min-h-[calc(100vh-5rem)] max-w-xl items-center justify-center">
                <section className="w-full rounded-[2rem] border border-slate-200 bg-white p-6 shadow-[0_20px_60px_rgba(15,23,42,0.08)]">
                    <div className="mb-6">
                        <p className="text-sm font-semibold uppercase tracking-[0.24em] text-blue-600">Opal Game Studios Template Game</p>
                        <p className="mt-6 text-sm font-semibold uppercase tracking-[0.22em] text-slate-500">Authentication</p>
                        <h2 className="mt-2 text-2xl font-semibold text-slate-950">{MODE_COPY[mode]}</h2>
                    </div>

                    <form ref={formRef} className="space-y-4" onSubmit={handleSubmit}>
                        {renderFormFields({
                            mode,
                            emailRef,
                            passwordRef,
                            usernameRef
                        })}

                        {error ? (
                            <p
                                role="alert"
                                className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700"
                            >
                                {error}
                            </p>
                        ) : null}
                        {success ? (
                            <p
                                role="status"
                                className="rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700"
                            >
                                {success}
                            </p>
                        ) : null}

                        <WaButton
                            appearance="filled"
                            variant="brand"
                            type="button"
                            disabled={submitting}
                            onPress={() => formRef.current?.requestSubmit()}
                        >
                            {submitting ? 'Working...' : 'Continue'}
                        </WaButton>
                    </form>

                    <div className="mt-6 flex flex-wrap gap-3">
                        {mode !== 'login' && (
                            <a href="/login">
                                <wa-button appearance="outlined" type="button">Sign in</wa-button>
                            </a>
                        )}
                        {mode !== 'register' && (
                            <a href="/login?mode=register">
                                <wa-button appearance="outlined" type="button">Create account</wa-button>
                            </a>
                        )}
                        {mode !== 'forgot' && (
                            <a href="/login?mode=forgot">
                                <wa-button appearance="plain" type="button">Forgot password</wa-button>
                            </a>
                        )}
                    </div>
                </section>
            </div>
        </main>
    );
}
