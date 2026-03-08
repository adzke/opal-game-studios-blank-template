import cors from 'cors';
import express from 'express';
import { createServer } from 'http';
import { Server as SocketServer } from 'socket.io';
import supertokens from 'supertokens-node';
import { errorHandler, middleware } from 'supertokens-node/framework/express/index.js';
import { verifySession } from 'supertokens-node/recipe/session/framework/express/index.js';
import {
    getGameStateForUser,
    resetGameStateForUser,
    updateGameStateForUser
} from './gameService.js';
import { hydrateUser, socketAuth } from './middleware.js';
import { initSupertokens } from './supertokens.js';

function createAllowedOrigins() {
    return [
        'http://localhost:3000',
        'http://127.0.0.1:3000',
        'http://localhost:3001',
        'http://127.0.0.1:3001',
        process.env.API_DOMAIN,
        process.env.WEBSITE_DOMAIN
    ].filter(Boolean);
}

export function createCorsOptions() {
    const allowedOrigins = createAllowedOrigins();
    let corsHeaders = [];

    try {
        corsHeaders = supertokens.getAllCORSHeaders();
    } catch (_error) {
        corsHeaders = [];
    }

    return {
        origin(origin, callback) {
            if (process.env.CORS_ALLOW_ALL === 'true' || !origin || allowedOrigins.includes(origin)) {
                callback(null, true);
                return;
            }

            callback(new Error('Not allowed by CORS'));
        },
        methods: ['GET', 'POST'],
        credentials: true,
        allowedHeaders: ['content-type', ...corsHeaders]
    };
}

export function buildApp({
    initializeAuth = true,
    authMiddlewareFactory = middleware,
    authErrorHandlerFactory = errorHandler,
    verifySessionFactory = verifySession,
    hydrateUserMiddleware = hydrateUser,
    gameService = {
        getGameStateForUser,
        updateGameStateForUser,
        resetGameStateForUser
    },
    socketAuthMiddleware = socketAuth,
    socketServerFactory = (httpServer, options) => new SocketServer(httpServer, options)
} = {}) {
    if (initializeAuth) {
        initSupertokens();
    }

    const app = express();
    const httpServer = createServer(app);
    const corsOptions = createCorsOptions();
    const io = socketServerFactory(httpServer, { cors: corsOptions });
    const requireAuth = [verifySessionFactory(), hydrateUserMiddleware];

    io.use(socketAuthMiddleware);
    io.on('connection', (socket) => {
        socket.emit('socket:ready', { authenticated: Boolean(socket.user) });
    });

    app.use(cors(corsOptions));
    app.use(authMiddlewareFactory());
    app.use(express.json());

    app.get('/health', (_req, res) => {
        res.json({ status: 'ok' });
    });

    app.get('/api/me', requireAuth, (req, res) => {
        res.json(req.user);
    });

    app.get('/api/game/state', requireAuth, async (req, res, next) => {
        try {
            const state = await gameService.getGameStateForUser(req.user.id);
            res.json(state);
        } catch (error) {
            next(error);
        }
    });

    app.post('/api/game/state', requireAuth, async (req, res, next) => {
        try {
            const score = Number(req.body?.score);
            if (!Number.isInteger(score) || score < 0) {
                res.status(400).json({ error: 'score must be a non-negative integer' });
                return;
            }

            const state = await gameService.updateGameStateForUser(req.user.id, score);
            res.json(state);
        } catch (error) {
            next(error);
        }
    });

    app.post('/api/game/reset', requireAuth, async (req, res, next) => {
        try {
            const state = await gameService.resetGameStateForUser(req.user.id);
            res.json(state);
        } catch (error) {
            next(error);
        }
    });

    app.use(authErrorHandlerFactory());
    app.use((error, _req, res, next) => {
        void next;
        res.status(500).json({ error: error.message || 'Internal server error' });
    });

    return { app, httpServer, io };
}
