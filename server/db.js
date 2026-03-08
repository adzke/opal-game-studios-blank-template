import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';
import pkg from 'pg';
import { fileURLToPath } from 'url';

dotenv.config();

const { Pool } = pkg;
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const defaultMigrationsDir = path.join(__dirname, 'migrations');

const pool = new Pool({
    connectionString: process.env.DATABASE_URL
});

export function query(text, params) {
    return pool.query(text, params);
}

export function getClient() {
    return pool.connect();
}

export async function ensureMetadataTables(queryFn = query) {
    await queryFn(`
        CREATE TABLE IF NOT EXISTS _migrations (
            id SERIAL PRIMARY KEY,
            name VARCHAR(255) UNIQUE NOT NULL,
            applied_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );
    `);
}

export async function runMigrations({ migrationsDir = defaultMigrationsDir, queryFn = query } = {}) {
    await ensureMetadataTables(queryFn);

    const applied = await queryFn('SELECT name FROM _migrations ORDER BY name ASC');
    const appliedNames = new Set(applied.rows.map((row) => row.name));
    const files = fs.readdirSync(migrationsDir).filter((file) => file.endsWith('.sql')).sort();

    for (const file of files) {
        if (appliedNames.has(file)) {
            continue;
        }

        const sql = fs.readFileSync(path.join(migrationsDir, file), 'utf8');
        await queryFn('BEGIN');
        try {
            await queryFn(sql);
            await queryFn('INSERT INTO _migrations (name) VALUES ($1)', [file]);
            await queryFn('COMMIT');
        } catch (error) {
            await queryFn('ROLLBACK');
            throw error;
        }
    }
}

export async function initDb(queryFn = query) {
    await ensureMetadataTables(queryFn);
    await queryFn('SELECT 1');
}
