import { query } from './db.js';

async function ensureProfile(userId, queryFn = query) {
    await queryFn(
        'INSERT INTO game_profiles (user_id) VALUES ($1) ON CONFLICT (user_id) DO NOTHING',
        [userId]
    );
}

export async function getGameStateForUser(userId, queryFn = query) {
    await ensureProfile(userId, queryFn);
    const result = await queryFn(
        'SELECT best_score, last_score FROM game_profiles WHERE user_id = $1',
        [userId]
    );
    const row = result.rows[0];

    return {
        bestScore: row?.best_score ?? 0,
        lastScore: row?.last_score ?? 0
    };
}

export async function updateGameStateForUser(userId, score, queryFn = query) {
    await ensureProfile(userId, queryFn);
    const result = await queryFn(
        `
            UPDATE game_profiles
            SET best_score = GREATEST(best_score, $2),
                last_score = $2,
                updated_at = CURRENT_TIMESTAMP
            WHERE user_id = $1
            RETURNING best_score, last_score
        `,
        [userId, score]
    );

    return {
        bestScore: result.rows[0].best_score,
        lastScore: result.rows[0].last_score
    };
}

export async function resetGameStateForUser(userId, queryFn = query) {
    await ensureProfile(userId, queryFn);
    const result = await queryFn(
        `
            UPDATE game_profiles
            SET last_score = 0,
                updated_at = CURRENT_TIMESTAMP
            WHERE user_id = $1
            RETURNING best_score, last_score
        `,
        [userId]
    );

    return {
        bestScore: result.rows[0].best_score,
        lastScore: result.rows[0].last_score
    };
}
