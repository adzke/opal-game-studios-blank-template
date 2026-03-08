import dotenv from 'dotenv';
import { runMigrations } from './db.js';

dotenv.config();

runMigrations()
    .then(() => {
        console.log('Database migrations completed successfully.');
        process.exit(0);
    })
    .catch((error) => {
        console.error('Database migrations failed:', error);
        process.exit(1);
    });
