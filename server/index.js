import dotenv from 'dotenv';
import { buildApp } from './app.js';
import { initDb } from './db.js';

dotenv.config();

const port = Number(process.env.PORT || 3001);

async function start() {
    await initDb();
    const { httpServer } = buildApp();
    httpServer.listen(port, '0.0.0.0', () => {
        console.log(`Server running on http://0.0.0.0:${port}`);
    });
}

start().catch((error) => {
    console.error('Server boot failed:', error);
    process.exit(1);
});
