import { Express, Request, Response } from 'express';
import Razorpay from 'razorpay';
import crypto from 'crypto';
import { Database } from 'sqlite';
import { v4 as uuidv4 } from 'uuid';

export function setupRoutes(app: Express, db: Database) {
    const razorpay = new Razorpay({
        key_id: process.env.RAZORPAY_KEY_ID || 'rzp_test_mock_id',
        key_secret: process.env.RAZORPAY_KEY_SECRET || 'rzp_test_mock_secret'
    });

    // 1. Create order
    app.post('/api/create-order', async (req: Request, res: Response) => {
        try {
            const options = {
                amount: 20000, // Amount in paise (200.00 INR)
                currency: "INR",
                receipt: `receipt_${Date.now()}`
            };

            const order = await razorpay.orders.create(options);
            res.json(order);
        } catch (error) {
            console.error('Order creation error:', error);
            res.status(500).json({ error: 'Order creation failed' });
        }
    });

    // 2. Verify payment & generate key
    app.post('/api/verify-payment', async (req: Request, res: Response) => {
        const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = req.body;

        const body = razorpay_order_id + "|" + razorpay_payment_id;
        const expectedSignature = crypto
            .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET || 'rzp_test_mock_secret')
            .update(body.toString())
            .digest('hex');

        if (expectedSignature === razorpay_signature) {
            // Payment verified! Generate unique key
            const uniqueKey = generateLicenseKey();
            const id = uuidv4();

            try {
                await db.run(
                    'INSERT INTO license_keys (id, key, order_id, status) VALUES (?, ?, ?, ?)',
                    [id, uniqueKey, razorpay_order_id, 'ACTIVE']
                );

                res.json({ success: true, key: uniqueKey });
            } catch (error) {
                console.error('DB storage error:', error);
                res.status(500).json({ error: 'Failed to store license key' });
            }
        } else {
            res.status(400).json({ success: false, message: 'Invalid signature' });
        }
    });

    // 3. Verify key for the game
    app.post('/api/verify-key', async (req: Request, res: Response) => {
        const { key } = req.body;

        if (!key) {
            return res.status(400).json({ valid: false, message: 'Key is required' });
        }

        try {
            const result = await db.get('SELECT * FROM license_keys WHERE key = ?', [key]);

            if (result) {
                if (result.status === 'ACTIVE') {
                    res.json({ valid: true, status: 'ACTIVE' });
                } else {
                    res.json({ valid: false, status: result.status });
                }
            } else {
                res.json({ valid: false, message: 'Invalid key' });
            }
        } catch (error) {
            console.error('Verification error:', error);
            res.status(500).json({ error: 'Internal server error' });
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
