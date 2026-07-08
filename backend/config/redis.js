const redis = require('redis');

let redisClient = null;
let isFallback = false;
const fallbackStore = new Map();

// Helper in-memory client that mimics Redis operations
const memoryClient = {
  get: async (key) => {
    const item = fallbackStore.get(key);
    if (!item) return null;
    if (item.expiry && Date.now() > item.expiry) {
      fallbackStore.delete(key);
      return null;
    }
    return item.value;
  },
  set: async (key, value, options = {}) => {
    const item = { value, created: Date.now() };
    if (options.EX) {
      item.expiry = Date.now() + options.EX * 1000;
    }
    fallbackStore.set(key, item);
    return 'OK';
  },
  del: async (key) => {
    return fallbackStore.delete(key) ? 1 : 0;
  },
  keys: async (pattern) => {
    const regex = new RegExp('^' + pattern.replace(/\*/g, '.*') + '$');
    const matches = [];
    for (const key of fallbackStore.keys()) {
      // Evict expired first
      const item = fallbackStore.get(key);
      if (item && item.expiry && Date.now() > item.expiry) {
        fallbackStore.delete(key);
        continue;
      }
      if (regex.test(key)) {
        matches.push(key);
      }
    }
    return matches;
  },
  connect: async () => {},
  disconnect: async () => {},
  quit: async () => {},
  isReady: true
};

async function initializeRedis() {
  const url = process.env.REDIS_URL || 'redis://localhost:6379';
  console.log('Attempting to connect to Redis...');
  
  try {
    const client = redis.createClient({
      url,
      socket: {
        connectTimeout: 2000,
        reconnectStrategy: false // fail fast
      }
    });

    client.on('error', (err) => {
      // Silence initial logs since we handle fallback
    });

    await client.connect();
    redisClient = client;
    isFallback = false;
    console.log('Successfully connected to Redis session store!');
  } catch (err) {
    console.warn('Redis connection failed. Falling back to Server In-Memory Session Storage.', err.message);
    redisClient = memoryClient;
    isFallback = true;
  }
}

const cache = {
  get: async (key) => {
    try {
      const val = await redisClient.get(key);
      return val ? JSON.parse(val) : null;
    } catch {
      return null;
    }
  },
  set: async (key, val, expireSeconds = 3600) => {
    try {
      const strVal = JSON.stringify(val);
      if (isFallback) {
        await redisClient.set(key, strVal, { EX: expireSeconds });
      } else {
        await redisClient.set(key, strVal, { EX: expireSeconds });
      }
      return true;
    } catch {
      return false;
    }
  },
  del: async (key) => {
    try {
      await redisClient.del(key);
      return true;
    } catch {
      return false;
    }
  },
  isFallback: () => isFallback
};

module.exports = {
  initializeRedis,
  cache
};
