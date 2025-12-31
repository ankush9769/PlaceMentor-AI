// Simple in-memory cache to reduce API calls
class Cache {
  constructor(ttl = 3600000) { // Default 1 hour TTL
    this.cache = new Map();
    this.ttl = ttl;
  }

  generateKey(...args) {
    return JSON.stringify(args);
  }

  get(key) {
    const item = this.cache.get(key);
    if (!item) return null;

    // Check if expired
    if (Date.now() > item.expiry) {
      this.cache.delete(key);
      return null;
    }

    console.log('✅ Cache hit:', key.substring(0, 50) + '...');
    return item.value;
  }

  set(key, value) {
    this.cache.set(key, {
      value,
      expiry: Date.now() + this.ttl
    });
    console.log('💾 Cached:', key.substring(0, 50) + '...');
  }

  clear() {
    this.cache.clear();
    console.log('🗑️ Cache cleared');
  }

  size() {
    return this.cache.size;
  }
}

// Create singleton instances
export const questionCache = new Cache(7200000); // 2 hours for questions
export const evaluationCache = new Cache(3600000); // 1 hour for evaluations

export default Cache;
