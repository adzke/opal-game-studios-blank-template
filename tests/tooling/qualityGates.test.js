import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

import { describe, expect, it } from 'vitest';

import vitestConfig from '../../vitest.config.js';

const repoRoot = resolve(fileURLToPath(new URL('../..', import.meta.url)));
const packageJson = JSON.parse(readFileSync(resolve(repoRoot, 'package.json'), 'utf8'));

describe('quality gate configuration', () => {
    it('lints JSX files from the root lint script', () => {
        expect(packageJson.scripts.lint).toContain('--ext');
        expect(packageJson.scripts.lint).toContain('.jsx');
    });

    it('ignores generated artifacts during linting', () => {
        const eslintIgnore = readFileSync(resolve(repoRoot, '.eslintignore'), 'utf8');

        expect(eslintIgnore).toMatch(/coverage\//);
        expect(eslintIgnore).toMatch(/\.next\//);
    });

    it('enforces global line coverage against source files', () => {
        expect(vitestConfig.test.coverage.thresholds).toMatchObject({
            lines: 90
        });
        expect(vitestConfig.test.coverage.exclude).toEqual(
            expect.arrayContaining([
                'coverage/**',
                '**/.next/**'
            ])
        );
    });
});
