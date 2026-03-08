import { getUser } from 'supertokens-node';
import { query } from './db.js';

export const MANAGED_PASSWORD_PLACEHOLDER = 'managed_by_supertokens';

function sanitizeUsername(value) {
    const normalized = (value || 'player').replace(/[^a-zA-Z0-9_]/g, '_').replace(/_+/g, '_');
    return normalized.slice(0, 50) || 'player';
}

async function ensureGameProfile(userId, queryFn = query) {
    await queryFn(
        'INSERT INTO game_profiles (user_id) VALUES ($1) ON CONFLICT (user_id) DO NOTHING',
        [userId]
    );
}

export async function findLocalUserBySupertokensId(supertokensId, queryFn = query) {
    const result = await queryFn(
        'SELECT id, username, email, supertokens_id FROM users WHERE supertokens_id = $1',
        [supertokensId]
    );
    return result.rows[0] || null;
}

export async function findLocalUserByEmail(email, queryFn = query) {
    const result = await queryFn(
        'SELECT id, username, email, supertokens_id FROM users WHERE email = $1',
        [email]
    );
    return result.rows[0] || null;
}

export async function createUniqueUsername(baseUsername, queryFn = query) {
    const seed = sanitizeUsername(baseUsername);

    for (let attempt = 0; attempt < 10; attempt += 1) {
        const candidate = attempt === 0 ? seed : `${seed.slice(0, 44)}_${attempt}`;
        const existing = await queryFn('SELECT id FROM users WHERE username = $1', [candidate]);
        if (existing.rowCount === 0) {
            return candidate;
        }
    }

    return `${seed.slice(0, 40)}_${Date.now().toString().slice(-6)}`;
}

export async function insertLocalUser({ username, email, supertokensId }, queryFn = query) {
    const resolvedUsername = await createUniqueUsername(username, queryFn);
    const result = await queryFn(
        `
            INSERT INTO users (username, password, email, supertokens_id)
            VALUES ($1, $2, $3, $4)
            RETURNING id, username, email, supertokens_id
        `,
        [resolvedUsername, MANAGED_PASSWORD_PLACEHOLDER, email, supertokensId]
    );
    await ensureGameProfile(result.rows[0].id, queryFn);
    return result.rows[0];
}

export async function linkLocalUserByEmail({ email, supertokensId }, queryFn = query) {
    const result = await queryFn(
        `
            UPDATE users
            SET supertokens_id = $1
            WHERE email = $2
            RETURNING id, username, email, supertokens_id
        `,
        [supertokensId, email]
    );
    if (result.rows[0]) {
        await ensureGameProfile(result.rows[0].id, queryFn);
    }
    return result.rows[0] || null;
}

export async function createOrRelinkLocalUser({ supertokensId, email, preferredUsername }, queryFn = query) {
    const existingBySupertokensId = await findLocalUserBySupertokensId(supertokensId, queryFn);
    if (existingBySupertokensId) {
        await ensureGameProfile(existingBySupertokensId.id, queryFn);
        return existingBySupertokensId;
    }

    const existingByEmail = email ? await findLocalUserByEmail(email, queryFn) : null;
    if (existingByEmail) {
        return linkLocalUserByEmail({ email, supertokensId }, queryFn);
    }

    return insertLocalUser({
        username: preferredUsername || email?.split('@')[0] || 'player',
        email,
        supertokensId
    }, queryFn);
}

export async function hydrateLocalUserFromSupertokensId(supertokensId, queryFn = query, getUserFn = getUser) {
    const existing = await findLocalUserBySupertokensId(supertokensId, queryFn);
    if (existing) {
        await ensureGameProfile(existing.id, queryFn);
        return existing;
    }

    const supertokensUser = await getUserFn(supertokensId);
    if (!supertokensUser) {
        return null;
    }

    const email = supertokensUser.emails[0];
    return createOrRelinkLocalUser({
        supertokensId,
        email,
        preferredUsername: email?.split('@')[0] || 'player'
    }, queryFn);
}
