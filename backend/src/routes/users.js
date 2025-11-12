import express from 'express';
import pool from '../db.js';
import { authenticate } from '../middleware/auth.js';
import { permit } from '../middleware/rbac.js';
const router = express.Router();
router.use(authenticate);
router.get('/', permit('admin'), async (req, res) => {
  const r = await pool.query('SELECT id,name,email,role FROM users');
  res.json(r.rows);
});
export default router;
