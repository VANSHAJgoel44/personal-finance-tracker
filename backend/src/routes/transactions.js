import express from 'express';
import pool from '../db.js';
import { authenticate } from '../middleware/auth.js';
import { permit } from '../middleware/rbac.js';
import { txnLimiter } from '../middleware/rateLimit.js';
const router = express.Router();
router.use(authenticate);
router.get('/', txnLimiter, async (req, res) => {
  const { page=1, per=20, q, category } = req.query;
  const offset = (page-1)*per;
  let base = 'SELECT * FROM transactions WHERE user_id=$1';
  const vals = [req.user.id];
  if (category) { vals.push(category); base += ` AND category=$${vals.length}`; }
  if (q) { vals.push(`%${q}%`); base += ` AND description ILIKE $${vals.length}`; }
  base += ` ORDER BY date DESC LIMIT $${vals.length+1} OFFSET $${vals.length+2}`;
  vals.push(per, offset);
  const r = await pool.query(base, vals);
  res.json(r.rows);
});
router.post('/', txnLimiter, permit('admin','user'), async (req, res) => {
  const { amount, type, category, description, date } = req.body;
  const q = 'INSERT INTO transactions(user_id,amount,type,category,description,date) VALUES($1,$2,$3,$4,$5,$6) RETURNING *';
  const r = await pool.query(q, [req.user.id, amount, type, category, description, date]);
  res.json(r.rows[0]);
});
router.put('/:id', txnLimiter, permit('admin','user'), async (req, res) => {
  const { id } = req.params;
  const { amount, type, category, description, date } = req.body;
  const q = 'UPDATE transactions SET amount=$1,type=$2,category=$3,description=$4,date=$5 WHERE id=$6 AND user_id=$7 RETURNING *';
  const r = await pool.query(q, [amount,type,category,description,date,id,req.user.id]);
  res.json(r.rows[0] || null);
});
router.delete('/:id', txnLimiter, permit('admin','user'), async (req, res) => {
  const { id } = req.params;
  const q = 'DELETE FROM transactions WHERE id=$1 AND user_id=$2 RETURNING id';
  const r = await pool.query(q, [id, req.user.id]);
  res.json({ deleted: !!r.rows[0] });
});
export default router;
