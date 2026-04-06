import { Express, Request, Response } from 'express';
import crypto from 'crypto';

export function setupRoutes(app: Express, db: any) {
    // 1. Verify key for the game
    app.post('/api/verify-key', async (req: Request, res: Response) => {
        const { key } = req.body;

        if (!key) {
            return res.status(400).json({ valid: false, message: 'Key is required' });
        }

        try {
            const result = await db.get('SELECT * FROM license_keys WHERE key = ?', [key]);

            if (result) {
                if (result.status === 'ACTIVE') {
                    // Update key status to USED immediately after successful verification
                    await db.run(
                        'UPDATE license_keys SET status = ?, used_at = ? WHERE key = ?',
                        ['USED', new Date().toISOString(), key]
                    );
                    
                    res.json({ valid: true, status: 'ACTIVE' });
                } else {
                    res.json({ valid: false, status: result.status, message: 'Key has already been used or is inactive' });
                }
            } else {
                res.json({ valid: false, message: 'Invalid key' });
            }
        } catch (error) {
            console.error('Verification error:', error);
            res.status(500).json({ error: 'Internal server error' });
        }
    });

    // 2. Admin Portal (Manual License Generation)
    app.post('/api/admin/generate-key', async (req: Request, res: Response) => {
        const { adminPassword } = req.body;
        const secretPassword = process.env.ADMIN_PASSWORD || 'forgetful';

        if (adminPassword !== secretPassword) {
            return res.status(403).json({ success: false, message: 'Unauthorized access. The memory is locked.' });
        }

        const uniqueKey = generateLicenseKey();
        const id = crypto.randomUUID();

        try {
            await db.run(
                'INSERT INTO license_keys (id, key, order_id, status) VALUES (?, ?, ?, ?)',
                [id, uniqueKey, 'ADMIN_MANUAL', 'ACTIVE']
            );

            res.json({ success: true, key: uniqueKey });
        } catch (error) {
            console.error('DB storage error:', error);
            res.status(500).json({ error: 'Failed to store license key' });
        }
    });
}

function generateLicenseKey() {
    // Generate a 16-character alphanumeric key: XXXX-XXXX-XXXX-XXXX
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let key = '';
    for (let i = 0; i < 16; i++) {
        if (i > 0 && i % 4 === 0) key += '-';
        key += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return key;
}
