import Session from 'supertokens-node/recipe/session/index.js';
import { hydrateLocalUserFromSupertokensId } from './userSync.js';

export async function hydrateUser(req, res, next) {
    if (!req.session) {
        next();
        return;
    }

    try {
        const supertokensId = req.session.getUserId();
        const user = await hydrateLocalUserFromSupertokensId(supertokensId);
        if (!user) {
            res.status(401).json({ error: 'User sync error' });
            return;
        }

        req.user = {
            id: user.id,
            username: user.username,
            sessionId: req.session.getHandle()
        };
        next();
    } catch (error) {
        next(error);
    }
}

export function extractSocketToken(socket) {
    const authToken = socket.handshake.auth?.token;
    if (authToken) {
        return authToken;
    }

    const headerToken = socket.handshake.headers?.authorization?.split(' ')[1];
    if (headerToken) {
        return headerToken;
    }

    const rawCookie = socket.handshake.headers?.cookie || '';
    const accessCookie = rawCookie.split(';').map((entry) => entry.trim()).find((entry) => entry.startsWith('sAccessToken='));
    return accessCookie ? accessCookie.split('=')[1] : null;
}

export async function socketAuth(socket, next) {
    try {
        const token = extractSocketToken(socket);
        if (!token) {
            socket.user = null;
            next();
            return;
        }

        const session = await Session.getSessionWithoutRequestResponse(token, undefined, { checkDatabase: true });
        socket.user = await hydrateLocalUserFromSupertokensId(session.getUserId());
        next();
    } catch (_error) {
        socket.user = null;
        next();
    }
}
