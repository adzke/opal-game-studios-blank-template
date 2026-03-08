import { describe, expect, it, vi } from 'vitest';

vi.mock('@awesome.me/webawesome/dist/components/button/button.js', () => ({}));
vi.mock('@awesome.me/webawesome/dist/components/input/input.js', () => ({}));
vi.mock('@awesome.me/webawesome/dist/components/card/card.js', () => ({}));
vi.mock('@awesome.me/webawesome/dist/components/badge/badge.js', () => ({}));

describe('webawesome registration', () => {
    it('loads the required Web Awesome component registrations', async () => {
        await expect(import('../../packages/game/src/webawesome.js')).resolves.toBeDefined();
    });
});
