import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('supertokens-node', () => ({
    default: {
        init: vi.fn(),
        getAllCORSHeaders: vi.fn(() => [])
    }
}));

vi.mock('supertokens-node/recipe/session/index.js', () => ({
    default: {
        init: vi.fn(() => ({ recipe: 'session' }))
    }
}));

vi.mock('supertokens-node/recipe/emailpassword/index.js', () => ({
    default: {
        init: vi.fn((config) => config)
    }
}));

vi.mock('../../server/userSync.js', () => ({
    createOrRelinkLocalUser: vi.fn()
}));

import supertokens from 'supertokens-node';
import { createOrRelinkLocalUser } from '../../server/userSync.js';

describe('initSupertokens', () => {
    beforeEach(() => {
        vi.resetModules();
    });

    it('configures EmailPassword and Session recipes', async () => {
        const { initSupertokens } = await import('../../server/supertokens.js');
        initSupertokens();

        const config = vi.mocked(supertokens.init).mock.calls[0][0];
        expect(config.appInfo.appName).toBe('Opal Game Studios Template Game');
        expect(config.recipeList).toHaveLength(2);
    });

    it('syncs local users on signup and signin', async () => {
        const { initSupertokens } = await import('../../server/supertokens.js');
        initSupertokens();

        const config = vi.mocked(supertokens.init).mock.calls[0][0];
        const emailPasswordRecipe = config.recipeList.find((entry) => entry.override);
        const apis = emailPasswordRecipe.override.apis({
            signUpPOST: vi.fn(async () => ({ status: 'OK', user: { id: 'st-1', emails: ['player@example.com'] } })),
            signInPOST: vi.fn(async () => ({ status: 'OK', user: { id: 'st-1', emails: ['player@example.com'] } }))
        });

        await apis.signUpPOST({
            formFields: [
                { id: 'username', value: 'player' }
            ]
        });
        await apis.signInPOST({});

        expect(createOrRelinkLocalUser).toHaveBeenCalledTimes(2);
    });

    it('logs reset links locally when LOG_AUTH_EMAILS is enabled', async () => {
        process.env.LOG_AUTH_EMAILS = 'true';
        const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
        const { initSupertokens } = await import('../../server/supertokens.js');
        initSupertokens();

        const config = vi.mocked(supertokens.init).mock.calls[0][0];
        const emailPasswordRecipe = config.recipeList.find((entry) => entry.emailDelivery);
        const delivery = emailPasswordRecipe.emailDelivery.override({
            sendEmail: vi.fn()
        });

        await delivery.sendEmail({
            type: 'PASSWORD_RESET',
            user: { email: 'player@example.com' },
            passwordResetLink: 'http://localhost/reset?token=abc'
        });

        expect(consoleSpy).toHaveBeenCalledWith(
            '[Auth Email] Reset link for player@example.com: http://localhost/reset?token=abc'
        );

        consoleSpy.mockRestore();
        delete process.env.LOG_AUTH_EMAILS;
    });
});
