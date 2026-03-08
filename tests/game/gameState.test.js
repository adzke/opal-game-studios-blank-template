import { describe, expect, it, vi } from 'vitest';
import {
    ARENA_HALF_SIZE,
    createInitialState,
    normalizeVector,
    serializeGameState,
    stepGameState
} from '../../packages/game/src/gameState.js';

describe('gameState helpers', () => {
    it('normalizes a vector', () => {
        expect(normalizeVector({ x: 3, z: 4 })).toEqual({ x: 0.6, z: 0.8 });
        expect(normalizeVector({ x: 0, z: 0 })).toEqual({ x: 0, z: 0 });
    });

    it('creates an initial state with a spawned collectible', () => {
        const state = createInitialState({ score: 3, random: () => 0.2 });
        expect(state.score).toBe(3);
        expect(Math.abs(state.collectible.x)).toBeLessThan(ARENA_HALF_SIZE);
        expect(Math.abs(state.collectible.z)).toBeLessThan(ARENA_HALF_SIZE);
    });

    it('steps movement and clamps the player inside the arena', () => {
        const result = stepGameState(
            {
                mode: 'playing',
                score: 0,
                player: { x: ARENA_HALF_SIZE, z: ARENA_HALF_SIZE },
                collectible: { x: 0, z: 0 }
            },
            { x: 1, z: 1 },
            1,
            vi.fn()
        );

        expect(result.state.player.x).toBeLessThan(ARENA_HALF_SIZE);
        expect(result.state.player.z).toBeLessThan(ARENA_HALF_SIZE);
    });

    it('increments score and respawns the collectible on collection', () => {
        const random = vi.fn()
            .mockReturnValueOnce(0.1)
            .mockReturnValueOnce(0.9)
            .mockReturnValueOnce(0.2)
            .mockReturnValueOnce(0.8);

        const result = stepGameState(
            {
                mode: 'playing',
                score: 1,
                player: { x: 0, z: 0 },
                collectible: { x: 0.2, z: 0.2 }
            },
            { x: 0, z: 0 },
            1 / 60,
            random
        );

        expect(result.didCollect).toBe(true);
        expect(result.state.score).toBe(2);
        expect(result.state.collectible).not.toEqual({ x: 0.2, z: 0.2 });
    });

    it('serializes the state for text-based inspection', () => {
        const serialized = serializeGameState({
            mode: 'playing',
            score: 4,
            player: { x: 1.234, z: -2.345 },
            collectible: { x: -1.111, z: 2.222 }
        });

        const parsed = JSON.parse(serialized);
        expect(parsed.score).toBe(4);
        expect(parsed.coordinateSystem).toContain('Origin at arena center');
    });
});
