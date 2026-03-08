import { StarterGame } from './StarterGame.js';

let activeController = null;

export async function initGame(options = {}) {
    if (activeController) {
        activeController.destroy();
    }

    const container = options.container || document.getElementById('game-container');
    if (!container) {
        throw new Error('A game container is required.');
    }

    const game = new StarterGame(options);
    await game.init();

    activeController = {
        restart() {
            game.restart();
        },
        destroy() {
            game.destroy();
            if (activeController === this) {
                activeController = null;
            }
        },
        getState() {
            return game.getState();
        },
        advanceTime(ms) {
            game.advance(ms);
        },
        renderGameToText() {
            return game.renderGameToText();
        }
    };

    window.advanceTime = (ms) => {
        game.advance(ms);
    };
    window.render_game_to_text = () => game.renderGameToText();

    return activeController;
}

export function resetInitGameForTests() {
    activeController?.destroy();
    activeController = null;
}
