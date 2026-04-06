interface LicenseKey {
    id: string;
    key: string;
    order_id: string;
    status: string;
    created_at: string;
    used_at: string | null;
}

class InMemoryDb {
    private keys: Map<string, LicenseKey> = new Map();

    async run(sql: string, params: any[] = []) {
        // INSERT
        if (sql.includes('INSERT INTO license_keys')) {
            const [id, key, order_id, status] = params;
            this.keys.set(id, {
                id,
                key,
                order_id,
                status,
                created_at: new Date().toISOString(),
                used_at: null
            });
        }
        // UPDATE status by key
        else if (sql.includes('UPDATE license_keys')) {
            const [status, used_at, key] = params;
            for (const entry of this.keys.values()) {
                if (entry.key === key) {
                    entry.status = status;
                    entry.used_at = used_at;
                    break;
                }
            }
        }
    }

    async get(sql: string, params: any[] = []): Promise<LicenseKey | undefined> {
        // SELECT by key
        if (sql.includes('WHERE key = ?')) {
            const searchKey = params[0];
            for (const entry of this.keys.values()) {
                if (entry.key === searchKey) return entry;
            }
            return undefined;
        }
        return undefined;
    }

    async exec(sql: string) {
        // Table creation is a no-op for in-memory store
    }
}

export async function initDb() {
    const db = new InMemoryDb();
    console.log('Using in-memory database (data resets on restart)');
    return db;
}
