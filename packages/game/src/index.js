export { initAuth, EmailPassword, Session, resolveApiOrigin } from './auth.js';
export { initGame, resetInitGameForTests } from './initGame.js';
export {
    ARENA_HALF_SIZE,
    PLAYER_RADIUS,
    COLLECTIBLE_RADIUS,
    PLAYER_SPEED,
    createInitialState,
    normalizeVector,
    serializeGameState,
    stepGameState
} from './gameState.js';
export { computeJoystickVector } from './virtualJoystick.js';
