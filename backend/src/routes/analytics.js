import express from 'express';
import pool from '../db.js';
import redis from '../cache.js';
import { authenticate } from '../middleware/auth.js';
import { analyticsLimiter } from '../middleware/rateLimit.js';
const router = express.Router();
router.use(authenticate);
router.get('/summary', analyticsLimiter, async (req, res) => {
  const key = `analytics:${req.user.id}:summary`;
  const cached = await redis.get(key);
  if (cached) return res.json(JSON.parse(cached));
  const q = `
    SELECT 
      date_trunc('month', date) as month,
      sum(CASE WHEN type='income' THEN amount ELSE 0 END) as income,
      sum(CASE WHEN type='expense' THEN amount ELSE 0 END) as expense
    FROM transactions WHERE user_id=$1 GROUP BY month ORDER BY month
  `;
  const r = await pool.query(q, [req.user.id]);
  const resObj = { monthly: r.rows };
  await redis.set(key, JSON.stringify(resObj), 'EX', 60*15);
  res.json(resObj);
});
router.get('/by-category', analyticsLimiter, async (req, res) => {
  const key = `analytics:${req.user.id}:cat`;
  const cached = await redis.get(key);
  if (cached) return res.json(JSON.parse(cached));
  const q = `SELECT category, sum(amount) as total FROM transactions WHERE user_id=$1 AND type='expense' GROUP BY category`;
  const r = await pool.query(q, [req.user.id]);
  await redis.set(key, JSON.stringify(r.rows), 'EX', 60*15);
  res.json(r.rows);
});
export default router;
