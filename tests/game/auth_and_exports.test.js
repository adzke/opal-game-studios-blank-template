import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('supertokens-web-js', () => ({
    default: {
        init: vi.fn()
    }
}));

vi.mock('supertokens-web-js/recipe/session', () => ({
    default: {
        init: vi.fn(() => ({ recipe: 'session' }))
    }
}));

vi.mock('supertokens-web-js/recipe/emailpassword', () => ({
    default: {
        init: vi.fn(() => ({ recipe: 'email-password' }))
    }
}));

describe('auth helpers and package exports', () => {
    beforeEach(() => {
        vi.unstubAllGlobals();
        vi.resetModules();
        delete window.__API_ORIGIN__;
    });

    afterEach(() => {
        vi.unstubAllGlobals();
    });

    it('resolves API origin and initializes SuperTokens once', async () => {
        window.__API_ORIGIN__ = 'http://example.test';
        const supertokens = (await import('supertokens-web-js')).default;
        const { initAuth, resolveApiOrigin } = await import('../../packages/game/src/auth.js');

        expect(resolveApiOrigin()).toBe('http://example.test');
        expect(resolveApiOrigin('http://explicit.test')).toBe('http://explicit.test');
        delete window.__API_ORIGIN__;
        expect(resolveApiOrigin()).toBe(window.location.origin);
        initAuth();
        initAuth();

        expect(supertokens.init).toHaveBeenCalledTimes(1);
        expect(supertokens.init).toHaveBeenCalledWith(expect.objectContaining({
            appInfo: expect.objectContaining({
                appName: 'Opal Game Studios Template Game'
            })
        }));
    });

    it('re-exports the expected helpers from the package entrypoint', async () => {
        const exports = await import('../../packages/game/src/index.js');
        expect(exports.initGame).toBeTypeOf('function');
        expect(exports.createInitialState).toBeTypeOf('function');
        expect(exports.computeJoystickVector).toBeTypeOf('function');
    });

    it('returns an empty API origin when window is unavailable', async () => {
        const { resolveApiOrigin } = await import('../../packages/game/src/auth.js');

        vi.stubGlobal('window', undefined);

        expect(resolveApiOrigin()).toBe('');
    });
});
