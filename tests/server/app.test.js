import request from 'supertest';
import { describe, expect, it, vi } from 'vitest';
import { buildApp } from '../../server/app.js';

function createProtectedApp() {
    const socketServer = {
        use: vi.fn(),
        on: vi.fn()
    };

    return buildApp({
        initializeAuth: false,
        authMiddlewareFactory: () => (_req, _res, next) => next(),
        authErrorHandlerFactory: () => (_err, _req, res, next) => {
            void next;
            return res.status(500).json({ error: 'auth' });
        },
        verifySessionFactory: () => (req, res, next) => {
            if (!req.headers.authorization) {
                res.status(401).json({ error: 'Unauthorized' });
                return;
            }
            req.session = {
                getHandle: () => 'session-1',
                getUserId: () => 'st-1'
            };
            next();
        },
        hydrateUserMiddleware: (req, _res, next) => {
            req.user = { id: 1, username: 'player', sessionId: 'session-1' };
            next();
        },
        socketServerFactory: () => socketServer,
        gameService: {
            getGameStateForUser: vi.fn(async () => ({ bestScore: 5, lastScore: 2 })),
            updateGameStateForUser: vi.fn(async (_userId, score) => ({ bestScore: score, lastScore: score })),
            resetGameStateForUser: vi.fn(async () => ({ bestScore: 5, lastScore: 0 }))
        }
    });
}

describe('app routes', () => {
    it('serves health and protects authenticated routes', async () => {
        const { app } = createProtectedApp();

        await request(app).get('/health').expect(200, { status: 'ok' });
        await request(app).get('/api/me').expect(401);

        const meResponse = await request(app)
            .get('/api/me')
            .set('Authorization', 'Bearer token')
            .expect(200);

        expect(meResponse.body.username).toBe('player');
    });

    it('reads, writes, and resets game state', async () => {
        const { app } = createProtectedApp();

        await request(app)
            .get('/api/game/state')
            .set('Authorization', 'Bearer token')
            .expect(200, { bestScore: 5, lastScore: 2 });

        await request(app)
            .post('/api/game/state')
            .set('Authorization', 'Bearer token')
            .send({ score: 7 })
            .expect(200, { bestScore: 7, lastScore: 7 });

        await request(app)
            .post('/api/game/state')
            .set('Authorization', 'Bearer token')
            .send({ score: -1 })
            .expect(400);

        await request(app)
            .post('/api/game/reset')
            .set('Authorization', 'Bearer token')
            .expect(200, { bestScore: 5, lastScore: 0 });
    });
});
