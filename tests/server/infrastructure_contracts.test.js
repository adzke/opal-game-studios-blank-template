import fs from 'fs';
import path from 'path';
import { describe, expect, it } from 'vitest';

const rootDir = path.resolve(process.cwd());

function readRootFile(name) {
    return fs.readFileSync(path.join(rootDir, name), 'utf8');
}

describe('infrastructure and policy contracts', () => {
    it('defines the expected Docker services and proxy routes', () => {
        const compose = readRootFile('docker-compose.yml');
        const debugCompose = readRootFile('docker-compose.debug.yml');
        const dockerfile = readRootFile('Dockerfile');
        const dockerfileDev = readRootFile('Dockerfile.dev');
        const nginx = readRootFile('ops/nginx.conf');

        expect(compose).toContain('nginx:');
        expect(compose).toContain('web:');
        expect(compose).toContain('server:');
        expect(compose).toContain('migrate:');
        expect(compose).toContain('supertokens:');
        expect(compose).toContain('db:');
        expect(debugCompose).toContain('bun install');
        expect(debugCompose).toContain('bunx next dev --hostname 0.0.0.0');
        expect(dockerfile).toContain('COPY package.json ./');
        expect(dockerfile).not.toContain('package-lock.json');
        expect(dockerfile).not.toContain('bun.lock');
        expect(dockerfile).toContain('RUN bun install --production');
        expect(dockerfileDev).toContain('COPY package.json ./');
        expect(dockerfileDev).toContain('RUN bun install');
        expect(nginx).toContain('location /api/');
        expect(nginx).toContain('location /auth/');
        expect(nginx).toContain('location /socket.io/');
    });

    it('defines the required lint and coverage policy files', () => {
        const packageJson = JSON.parse(readRootFile('package.json'));
        const agents = readRootFile('AGENTS.md');
        const gemini = readRootFile('gemini.md');

        expect(packageJson.scripts.lint).toContain('--ext .js,.jsx');
        expect(packageJson.scripts.lint).toContain('--max-warnings=0');
        expect(agents).toContain('Global line coverage');
        expect(gemini).toContain('>= 90%');
    });
});
