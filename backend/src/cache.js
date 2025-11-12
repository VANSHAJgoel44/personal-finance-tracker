// backend/src/cache.js
import Redis from 'ioredis';
import dotenv from 'dotenv';
dotenv.config();

function makeFallback() {
  const store = new Map();
  return {
    get: async (k) => {
      const v = store.get(k);
      return typeof v === 'undefined' ? null : v;
    },
    set: async (k, v, mode, ttl) => {
      if (mode && /EX/i.test(mode) && typeof ttl === 'number') {
        store.set(k, v);
        setTimeout(() => store.delete(k), ttl * 1000);
      } else {
        store.set(k, v);
      }
      return 'OK';
    },
    del: async (k) => { store.delete(k); return 1; },
    disconnect: async () => {},
    on: () => {}
  };
}

const RAW_URL = (process.env.REDIS_URL || '').trim();
const MAX_CONSECUTIVE_FAILURES = 5;

let client = null;
let fallback = makeFallback();
let usingFallback = false;
let consecutiveFailures = 0;

function createRedisClient(url) {
  const opts = {
    lazyConnect: true,
    connectTimeout: 10000,
    // null means unlimited retries controlled by retryStrategy
    maxRetriesPerRequest: null,
    retryStrategy(times) {
      if (times > 50) return null;
      return Math.min(200 + times * 200, 20000);
    },
    reconnectOnError(err) {
      const msg = err && err.message ? err.message : '';
      // If server says READONLY (common on some managed providers), don't reconnect
      if (msg.includes('READONLY')) return false;
      return true;
    }
  };

  const r = new Redis(url, opts);

  r.on('error', (err) => {
    try {
      console.error('[ioredis] error:', err && err.message ? err.message : err);
    } catch (e) {}
    consecutiveFailures += 1;
    if (consecutiveFailures >= MAX_CONSECUTIVE_FAILURES && !usingFallback) {
      console.error('[cache] too many redis failures, switching to in-memory fallback');
      try {
        usingFallback = true;
        r.disconnect();
        client = null;
      } catch (e) {
        console.error('[cache] error while disconnecting redis', e && e.message ? e.message : e);
      }
    }
  });

  r.on('connect', () => console.log('[ioredis] connecting'));
  r.on('ready', () => { console.log('[ioredis] ready'); consecutiveFailures = 0; });
  r.on('close', () => console.warn('[ioredis] closed'));
  r.on('end', () => console.warn('[ioredis] ended'));

  return r;
}

if (!RAW_URL) {
  console.warn('[cache] REDIS_URL not set — using in-memory fallback');
  usingFallback = true;
  client = null;
} else {
  client = createRedisClient(RAW_URL);
  (async () => {
    try {
      await client.connect();
      const pong = await client.ping();
      console.log('[ioredis] ping ->', pong);
      consecutiveFailures = 0;
    } catch (err) {
      console.error('[ioredis] initial connect/ping failed:', err && err.message ? err.message : err);
      consecutiveFailures += 1;
      if (consecutiveFailures >= MAX_CONSECUTIVE_FAILURES) {
        console.error('[cache] switching to in-memory fallback due to repeated failures');
        try { await client.disconnect(); } catch(e){/*ignore*/ }
        client = null;
        usingFallback = true;
      }
    }
  })();
}

const api = {
  get: async (k) => {
    if (usingFallback || !client) return fallback.get(k);
    try {
      return await client.get(k);
    } catch (e) {
      console.error('[cache.get] error', e && e.message ? e.message : e);
      return null;
    }
  },

  set: async (k, v, mode, ttl) => {
    if (usingFallback || !client) return fallback.set(k, v, mode, ttl);
    try {
      if (mode && /EX/i.test(mode) && typeof ttl === 'number') {
        return await client.set(k, v, 'EX', ttl);
      }
      return await client.set(k, v);
    } catch (e) {
      console.error('[cache.set] error', e && e.message ? e.message : e);
      return null;
    }
  },

  del: async (k) => {
    if (usingFallback || !client) return fallback.del(k);
    try {
      return await client.del(k);
    } catch (e) {
      console.error('[cache.del] error', e && e.message ? e.message : e);
      return 0;
    }
  },

  disconnect: async () => {
    if (client) {
      try { await client.disconnect(); } catch (e) { console.error('[cache.disconnect] error', e && e.message ? e.message : e); }
    }
  },

  on: (evt, h) => {
    if (client) client.on(evt, h);
    if (fallback && fallback.on) fallback.on(evt, h);
  },

  _usingFallback: () => usingFallback
};

export default api;
