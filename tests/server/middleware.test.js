import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('supertokens-node/recipe/session/index.js', () => ({
    default: {
        getSessionWithoutRequestResponse: vi.fn()
    }
}));

vi.mock('../../server/userSync.js', () => ({
    hydrateLocalUserFromSupertokensId: vi.fn()
}));

import Session from 'supertokens-node/recipe/session/index.js';
import { hydrateLocalUserFromSupertokensId } from '../../server/userSync.js';
import { extractSocketToken, hydrateUser, socketAuth } from '../../server/middleware.js';

describe('middleware helpers', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('extracts socket tokens from auth, headers, and cookies', () => {
        expect(extractSocketToken({ handshake: { auth: { token: 'a' }, headers: {} } })).toBe('a');
        expect(extractSocketToken({ handshake: { auth: {}, headers: { authorization: 'Bearer b' } } })).toBe('b');
        expect(extractSocketToken({ handshake: { auth: {}, headers: { cookie: 'x=1; sAccessToken=c' } } })).toBe('c');
    });

    it('hydrates request users from the session', async () => {
        const req = {
            session: {
                getUserId: () => 'st-1',
                getHandle: () => 'session-1'
            }
        };
        const res = {
            status: vi.fn(() => res),
            json: vi.fn()
        };
        const next = vi.fn();

        vi.mocked(hydrateLocalUserFromSupertokensId).mockResolvedValue({
            id: 1,
            username: 'player'
        });

        await hydrateUser(req, res, next);

        expect(req.user).toEqual({
            id: 1,
            username: 'player',
            sessionId: 'session-1'
        });
        expect(next).toHaveBeenCalled();
    });

    it('returns a 401 when hydration cannot recreate the local user', async () => {
        const req = {
            session: {
                getUserId: () => 'missing-user',
                getHandle: () => 'session-2'
            }
        };
        const res = {
            status: vi.fn(() => res),
            json: vi.fn()
        };
        const next = vi.fn();

        vi.mocked(hydrateLocalUserFromSupertokensId).mockResolvedValue(null);

        await hydrateUser(req, res, next);
        expect(res.status).toHaveBeenCalledWith(401);
    });

    it('authenticates sockets when a valid access token is present', async () => {
        const socket = {
            handshake: {
                auth: { token: 'token-1' },
                headers: {}
            }
        };

        vi.mocked(Session.getSessionWithoutRequestResponse).mockResolvedValue({
            getUserId: () => 'st-2'
        });
        vi.mocked(hydrateLocalUserFromSupertokensId).mockResolvedValue({
            id: 2,
            username: 'socket-user'
        });

        const next = vi.fn();
        await socketAuth(socket, next);

        expect(socket.user).toEqual({
            id: 2,
            username: 'socket-user'
        });
        expect(next).toHaveBeenCalled();
    });

    it('allows sockets through without a token and clears invalid sessions', async () => {
        const next = vi.fn();
        const emptySocket = {
            handshake: {
                auth: {},
                headers: {}
            }
        };

        await socketAuth(emptySocket, next);
        expect(emptySocket.user).toBeNull();

        vi.mocked(Session.getSessionWithoutRequestResponse).mockRejectedValue(new Error('bad token'));

        const badSocket = {
            handshake: {
                auth: { token: 'bad' },
                headers: {}
            }
        };

        await socketAuth(badSocket, next);
        expect(badSocket.user).toBeNull();
    });
});
