import express from 'express';
import pool from '../db.js';
import bcrypt from 'bcrypt';
import { sign } from '../utils/jwt.js';
import { authLimiter } from '../middleware/rateLimit.js';
const router = express.Router();
router.post('/register', authLimiter, async (req, res) => {
  const { name, email, password, role='user' } = req.body;
  const hash = await bcrypt.hash(password, 10);
  const q = 'INSERT INTO users(name,email,password,role) VALUES($1,$2,$3,$4) RETURNING id,name,email,role';
  const r = await pool.query(q, [name,email,hash,role]);
  res.json(r.rows[0]);
});
router.post('/login', authLimiter, async (req, res) => {
  const { email, password } = req.body;
  const q = 'SELECT id,name,email,password,role FROM users WHERE email=$1';
  const r = await pool.query(q, [email]);
  if (!r.rows[0]) return res.status(401).json({ error: 'Invalid' });
  const u = r.rows[0];
  const ok = await bcrypt.compare(password, u.password);
  if (!ok) return res.status(401).json({ error: 'Invalid' });
  const token = sign({ id: u.id, name: u.name, role: u.role, email: u.email });
  res.json({ token, user: { id: u.id, name: u.name, email: u.email, role: u.role } });
});
export default router;
