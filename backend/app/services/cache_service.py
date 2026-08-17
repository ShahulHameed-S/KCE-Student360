import os
import time
import json
from typing import Any, Optional

# In-memory store
# Format: {key: (value, expiry_timestamp)}
_in_memory_cache = {}

# Redis client placeholder
_redis_client = None
_redis_failed = False

def _get_redis_client():
    global _redis_client, _redis_failed
    if _redis_failed:
        return None
    if _redis_client is not None:
        return _redis_client
        
    redis_url = os.getenv("REDIS_URL")
    if not redis_url:
        _redis_failed = True
        return None
        
    try:
        import redis
        _redis_client = redis.Redis.from_url(redis_url, decode_responses=True, socket_timeout=2.0)
        # Test connection
        _redis_client.ping()
        print("[CACHE] Connected to Redis successfully using REDIS_URL.")
        return _redis_client
    except Exception as e:
        print(f"[CACHE] Failed to connect to Redis: {e}. Falling back to in-memory cache.")
        _redis_failed = True
        _redis_client = None
        return None

def get_cache(key: str) -> Optional[Any]:
    """Retrieves value from cache. Deserializes JSON if retrieved from Redis."""
    client = _get_redis_client()
    if client:
        try:
            val = client.get(key)
            if val is not None:
                return json.loads(val)
            return None
        except Exception as e:
            print(f"[CACHE] Redis get error for key '{key}': {e}. Falling back to in-memory.")
            
    # Fallback to in-memory
    if key in _in_memory_cache:
        val, expiry = _in_memory_cache[key]
        if time.time() < expiry:
            return val
        else:
            # Clean up expired item
            del _in_memory_cache[key]
    return None

def set_cache(key: str, value: Any, ttl_seconds: int = 60) -> None:
    """Sets a value in cache with a TTL (seconds). Serializes to JSON for Redis."""
    client = _get_redis_client()
    if client:
        try:
            serialized = json.dumps(value)
            client.set(key, serialized, ex=ttl_seconds)
            return
        except Exception as e:
            print(f"[CACHE] Redis set error for key '{key}': {e}. Falling back to in-memory.")
            
    # Fallback to in-memory
    _in_memory_cache[key] = (value, time.time() + ttl_seconds)

def delete_cache(key: str) -> None:
    """Deletes a key from cache."""
    client = _get_redis_client()
    if client:
        try:
            client.delete(key)
            return
        except Exception as e:
            print(f"[CACHE] Redis delete error for key '{key}': {e}. Falling back to in-memory.")
            
    # Fallback to in-memory
    if key in _in_memory_cache:
        del _in_memory_cache[key]

def delete_by_prefix(prefix: str) -> None:
    """Deletes keys matching the prefix."""
    client = _get_redis_client()
    if client:
        try:
            keys_to_delete = list(client.scan_iter(match=f"{prefix}*"))
            if keys_to_delete:
                client.delete(*keys_to_delete)
            return
        except Exception as e:
            print(f"[CACHE] Redis delete_by_prefix error for prefix '{prefix}': {e}. Falling back to in-memory.")
            
    # Fallback to in-memory
    keys_to_delete = [k for k in _in_memory_cache if k.startswith(prefix)]
    for k in keys_to_delete:
        del _in_memory_cache[k]

def invalidate_all_caches() -> None:
    """Invalidate all known performance/student caches globally."""
    print("[CACHE] Invalidating all mentor and leaderboard caches.")
    delete_by_prefix("mentor_students")
    delete_by_prefix("mentor_leaderboard")
    delete_by_prefix("mentor_dashboard_counts")
    delete_by_prefix("leaderboard_overall")
    delete_by_prefix("leaderboard_domain")
