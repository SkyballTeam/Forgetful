import sqlite3 from 'sqlite3';
import { open } from 'sqlite';
import path from 'path';

export async function initDb() {
    const db = await open({
        filename: path.join(__dirname, '../database.sqlite'),
        driver: sqlite3.Database
    });

    await db.exec(`
        CREATE TABLE IF NOT EXISTS license_keys (
            id TEXT PRIMARY KEY,
            key TEXT UNIQUE NOT NULL,
            order_id TEXT UNIQUE NOT NULL,
            status TEXT DEFAULT 'ACTIVE',
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            used_at DATETIME
        )
    `);

    return db;
}
