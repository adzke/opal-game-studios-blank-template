import fs from 'fs';
import os from 'os';
import path from 'path';
import { describe, expect, it, vi } from 'vitest';
import { initDb, runMigrations } from '../../server/db.js';

describe('db helpers', () => {
    it('initializes metadata tables and pings the database', async () => {
        const queryFn = vi.fn().mockResolvedValue({ rows: [] });
        await initDb(queryFn);
        expect(queryFn).toHaveBeenCalledWith(expect.stringContaining('CREATE TABLE IF NOT EXISTS _migrations'));
        expect(queryFn).toHaveBeenCalledWith('SELECT 1');
    });

    it('runs unapplied SQL migrations in order', async () => {
        const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'blank-game-migrations-'));
        fs.writeFileSync(path.join(tempDir, '001_first.sql'), 'SELECT 1;');
        fs.writeFileSync(path.join(tempDir, '002_second.sql'), 'SELECT 2;');

        const queryFn = vi.fn(async (sql) => {
            if (sql.startsWith('SELECT name FROM _migrations')) {
                return { rows: [] };
            }
            return { rows: [] };
        });

        await runMigrations({ migrationsDir: tempDir, queryFn });

        expect(queryFn).toHaveBeenCalledWith('BEGIN');
        expect(queryFn).toHaveBeenCalledWith('SELECT 1;');
        expect(queryFn).toHaveBeenCalledWith('SELECT 2;');
        expect(queryFn).toHaveBeenCalledWith('COMMIT');
    });
});
