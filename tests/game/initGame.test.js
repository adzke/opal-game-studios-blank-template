import { beforeEach, describe, expect, it, vi } from 'vitest';

const gameMocks = {
    init: vi.fn(async () => {}),
    restart: vi.fn(),
    destroy: vi.fn(),
    getState: vi.fn(() => ({ score: 2 })),
    advance: vi.fn(),
    renderGameToText: vi.fn(() => '{"score":2}')
};

vi.mock('../../packages/game/src/StarterGame.js', () => ({
    StarterGame: vi.fn(() => gameMocks)
}));

import { initGame, resetInitGameForTests } from '../../packages/game/src/initGame.js';

describe('initGame', () => {
    beforeEach(() => {
        gameMocks.init.mockClear();
        gameMocks.restart.mockClear();
        gameMocks.destroy.mockClear();
        gameMocks.getState.mockClear();
        gameMocks.advance.mockClear();
        gameMocks.renderGameToText.mockClear();
        resetInitGameForTests();
    });

    it('creates a controller and exposes deterministic window hooks', async () => {
        const container = document.createElement('div');
        container.id = 'game-container';
        document.body.appendChild(container);

        const controller = await initGame({ container });
        controller.advanceTime(32);

        expect(gameMocks.init).toHaveBeenCalled();
        expect(gameMocks.advance).toHaveBeenCalledWith(32);
        expect(window.render_game_to_text()).toBe('{"score":2}');

        controller.destroy();
        expect(gameMocks.destroy).toHaveBeenCalled();
    });

    it('replaces an existing controller and throws when no container exists', async () => {
        const container = document.createElement('div');
        document.body.appendChild(container);

        const firstController = await initGame({ container });
        const secondController = await initGame({ container });

        expect(gameMocks.destroy).toHaveBeenCalled();
        expect(secondController).toBeDefined();

        firstController.destroy();
        document.body.innerHTML = '';

        await expect(initGame()).rejects.toThrow('A game container is required.');
    });
});
