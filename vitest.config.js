import { defineConfig } from 'vitest/config';

export default defineConfig({
    test: {
        globals: true,
        environment: 'node',
        environmentMatchGlobs: [
            ['tests/web/**', 'jsdom'],
            ['tests/game/**', 'jsdom']
        ],
        setupFiles: ['tests/setup.web.js'],
        coverage: {
            provider: 'v8',
            reporter: ['text', 'json-summary', 'html'],
            thresholds: {
                lines: 90
            },
            exclude: [
                'coverage/**',
                '**/.next/**',
                'dist/**',
                'node_modules/**',
                'server/migrations/**',
                'server/index.js',
                'server/migrate.js',
                '**/*.config.js'
            ]
        }
    }
});
