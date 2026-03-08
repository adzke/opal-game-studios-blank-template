export const ARENA_HALF_SIZE = 6;
export const PLAYER_RADIUS = 0.45;
export const COLLECTIBLE_RADIUS = 0.35;
export const PLAYER_SPEED = 4;

function clamp(value, min, max) {
    return Math.max(min, Math.min(max, value));
}

export function normalizeVector(vector) {
    const magnitude = Math.hypot(vector.x, vector.z);
    if (magnitude <= 0) {
        return { x: 0, z: 0 };
    }

    return {
        x: vector.x / magnitude,
        z: vector.z / magnitude
    };
}

export function getSpawnPosition(random = Math.random, avoid = { x: 0, z: 0 }) {
    for (let attempt = 0; attempt < 12; attempt += 1) {
        const candidate = {
            x: (random() * 2 - 1) * (ARENA_HALF_SIZE - 1),
            z: (random() * 2 - 1) * (ARENA_HALF_SIZE - 1)
        };

        const distance = Math.hypot(candidate.x - avoid.x, candidate.z - avoid.z);
        if (distance >= 2.2) {
            return candidate;
        }
    }

    return { x: ARENA_HALF_SIZE - 1, z: ARENA_HALF_SIZE - 1 };
}

export function createInitialState({ score = 0, random = Math.random } = {}) {
    return {
        mode: 'playing',
        score,
        player: {
            x: 0,
            z: 0
        },
        collectible: getSpawnPosition(random)
    };
}

export function stepGameState(state, inputVector, deltaSeconds, random = Math.random) {
    const direction = normalizeVector(inputVector);
    const nextPlayer = {
        x: clamp(state.player.x + direction.x * PLAYER_SPEED * deltaSeconds, -ARENA_HALF_SIZE + PLAYER_RADIUS, ARENA_HALF_SIZE - PLAYER_RADIUS),
        z: clamp(state.player.z + direction.z * PLAYER_SPEED * deltaSeconds, -ARENA_HALF_SIZE + PLAYER_RADIUS, ARENA_HALF_SIZE - PLAYER_RADIUS)
    };
    const didCollect = Math.hypot(nextPlayer.x - state.collectible.x, nextPlayer.z - state.collectible.z) <= PLAYER_RADIUS + COLLECTIBLE_RADIUS;

    return {
        state: {
            ...state,
            player: nextPlayer,
            collectible: didCollect ? getSpawnPosition(random, nextPlayer) : state.collectible,
            score: didCollect ? state.score + 1 : state.score
        },
        didCollect
    };
}

export function serializeGameState(state) {
    return JSON.stringify({
        mode: state.mode,
        coordinateSystem: 'Origin at arena center. +X moves right, +Z moves downward on screen, Y is vertical.',
        player: {
            x: Number(state.player.x.toFixed(2)),
            z: Number(state.player.z.toFixed(2)),
            radius: PLAYER_RADIUS
        },
        collectible: {
            x: Number(state.collectible.x.toFixed(2)),
            z: Number(state.collectible.z.toFixed(2)),
            radius: COLLECTIBLE_RADIUS
        },
        score: state.score
    });
}
