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
if (!RAW_URL) {
  console.warn('[cache] REDIS_URL not set — using in-memory fallback cache');
  const fallback = makeFallback();
  export default fallback;
}

let client = null;
let fallback = null;

const MAX_FAILURES = 5;
let consecutiveFailures = 0;
let usingFallback = false;

function createClient(url) {
  // configure options for resiliency
  const opts = {
    lazyConnect: true,
    connectTimeout: 10000,
    maxRetriesPerRequest: null, // allow retrying behavior via retryStrategy
    retryStrategy(times) {
      if (times > 20) return null; // stop retrying after many attempts
      return Math.min(200 + times * 200, 20000);
    },
    reconnectOnError(err) {
      // recoverable network errors: let ioredis try to reconnect
      const message = (err && err.message) ? err.message : '';
      if (message.includes('READONLY')) return false;
      return true;
    },
    // For TLS URLs (rediss://) ioredis handles the tls flag automatically.
    // If you need to relax TLS validation (not recommended), pass tls:{ rejectUnauthorized:false }
  };

  const c = new Redis(url, opts);

  // Attach handlers immediately to avoid "Unhandled error event"
  c.on('error', (err) => {
    console.error('[ioredis] error:', err && err.message ? err.message : err);
    consecutiveFailures += 1;
    if (consecutiveFailures >= MAX_FAILURES && !usingFallback) {
      console.error('[ioredis] too many failures - switching to in-memory fallback');
      try {
        fallback = makeFallback();
        usingFallback = true;
        // close the redis client gracefully
        c.disconnect();
        client = null;
      } catch (e) {
        console.error('[ioredis] error while switching to fallback', e && e.message ? e.message : e);
      }
    }
  });

  c.on('connect', () => {
    console.log('[ioredis] connecting');
  });

  c.on('ready', () => {
    console.log('[ioredis] ready');
    consecutiveFailures = 0;
  });

  c.on('close', () => {
    console.warn('[ioredis] closed');
  });

  c.on('end', () => {
    console.warn('[ioredis] connection ended');
  });

  return c;
}

client = createClient(RAW_URL);

// attempt connect but don't throw if it fails (lazyConnect=false would throw)
(async () => {
  try {
    await client.connect();
    // once connected, do a ping to confirm
    const pong = await client.ping();
    console.log('[ioredis] ping ->', pong);
    consecutiveFailures = 0;
  } catch (err) {
    console.error('[ioredis] initial connect/ping failed:', err && err.message ? err.message : err);
    consecutiveFailures += 1;
    if (consecutiveFailures >= MAX_FAILURES) {
      console.error('[ioredis] switching to in-memory fallback due to repeated failures');
      try {
        client.disconnect();
      } catch (e) {}
      fallback = makeFallback();
      usingFallback = true;
      client = null;
    }
  }
})();

// exported wrapper that delegates to redis client or fallback
const api = {
  get: async (k) => {
    if (usingFallback) return fallback.get(k);
    if (!client) return null;
    try {
      const v = await client.get(k);
      return v;
    } catch (e) {
      console.error('[cache.get] error', e && e.message ? e.message : e);
      return null;
    }
  },

  set: async (k, v, mode, ttl) => {
    if (usingFallback) return fallback.set(k, v, mode, ttl);
    if (!client) return null;
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
    if (usingFallback) return fallback.del(k);
    if (!client) return 0;
    try {
      return await client.del(k);
    } catch (e) {
      console.error('[cache.del] error', e && e.message ? e.message : e);
      return 0;
    }
  },

  disconnect: async () => {
    if (client) {
      try {
        await client.disconnect();
      } catch (e) {
        console.error('[cache.disconnect] error', e && e.message ? e.message : e);
      }
    }
  },

  on: (event, handler) => {
    if (client) client.on(event, handler);
    if (fallback && fallback.on) fallback.on(event, handler);
  },

  _isUsingFallback: () => usingFallback
};

export default api;
