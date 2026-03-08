import { describe, expect, it, vi } from 'vitest';
import {
    getGameStateForUser,
    resetGameStateForUser,
    updateGameStateForUser
} from '../../server/gameService.js';

describe('gameService', () => {
    it('returns persisted game state for a user', async () => {
        const queryFn = vi.fn()
            .mockResolvedValueOnce({})
            .mockResolvedValueOnce({ rows: [{ best_score: 4, last_score: 2 }] });

        await expect(getGameStateForUser(10, queryFn)).resolves.toEqual({
            bestScore: 4,
            lastScore: 2
        });
    });

    it('updates best and last scores', async () => {
        const queryFn = vi.fn()
            .mockResolvedValueOnce({})
            .mockResolvedValueOnce({ rows: [{ best_score: 8, last_score: 8 }] });

        await expect(updateGameStateForUser(3, 8, queryFn)).resolves.toEqual({
            bestScore: 8,
            lastScore: 8
        });
    });

    it('resets only the last score', async () => {
        const queryFn = vi.fn()
            .mockResolvedValueOnce({})
            .mockResolvedValueOnce({ rows: [{ best_score: 9, last_score: 0 }] });

        await expect(resetGameStateForUser(3, queryFn)).resolves.toEqual({
            bestScore: 9,
            lastScore: 0
        });
    });
});
