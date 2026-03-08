import { describe, expect, it, vi } from 'vitest';
import {
    createOrRelinkLocalUser,
    createUniqueUsername,
    hydrateLocalUserFromSupertokensId,
    insertLocalUser
} from '../../server/userSync.js';

describe('userSync helpers', () => {
    it('creates a unique username when the first candidate exists', async () => {
        const queryFn = vi.fn()
            .mockResolvedValueOnce({ rowCount: 1, rows: [{ id: 1 }] })
            .mockResolvedValueOnce({ rowCount: 0, rows: [] });

        await expect(createUniqueUsername('player', queryFn)).resolves.toBe('player_1');
    });

    it('inserts a local user and creates a game profile', async () => {
        const queryFn = vi.fn()
            .mockResolvedValueOnce({ rowCount: 0, rows: [] })
            .mockResolvedValueOnce({ rows: [{ id: 12, username: 'player', email: 'p@example.com', supertokens_id: 'st-1' }] })
            .mockResolvedValueOnce({});

        await expect(insertLocalUser({
            username: 'player',
            email: 'p@example.com',
            supertokensId: 'st-1'
        }, queryFn)).resolves.toEqual({
            id: 12,
            username: 'player',
            email: 'p@example.com',
            supertokens_id: 'st-1'
        });
    });

    it('relinks an existing local row by email on sign in', async () => {
        const queryFn = vi.fn()
            .mockResolvedValueOnce({ rows: [] })
            .mockResolvedValueOnce({ rows: [{ id: 8, email: 'player@example.com' }] })
            .mockResolvedValueOnce({ rows: [{ id: 8, username: 'player', email: 'player@example.com', supertokens_id: 'st-2' }] })
            .mockResolvedValueOnce({});

        const user = await createOrRelinkLocalUser({
            supertokensId: 'st-2',
            email: 'player@example.com',
            preferredUsername: 'player'
        }, queryFn);

        expect(user.supertokens_id).toBe('st-2');
    });

    it('hydrates a missing local row from the SuperTokens user record', async () => {
        const queryFn = vi.fn()
            .mockResolvedValueOnce({ rows: [] })
            .mockResolvedValueOnce({ rows: [] })
            .mockResolvedValueOnce({ rows: [] })
            .mockResolvedValueOnce({ rowCount: 0, rows: [] })
            .mockResolvedValueOnce({ rows: [{ id: 4, username: 'player', email: 'player@example.com', supertokens_id: 'st-9' }] })
            .mockResolvedValueOnce({});

        const getUserFn = vi.fn(async () => ({
            id: 'st-9',
            emails: ['player@example.com']
        }));

        const user = await hydrateLocalUserFromSupertokensId('st-9', queryFn, getUserFn);
        expect(user.email).toBe('player@example.com');
    });
});
