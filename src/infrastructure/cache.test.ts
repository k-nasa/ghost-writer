import { assertEquals, assert } from "@std/assert";
import { LRUCache } from "./cache.ts";

Deno.test("LRUCache", async (t) => {
  await t.step("should store and retrieve values", () => {
    const cache = new LRUCache<string>();
    cache.set("key1", "value1");
    cache.set("key2", "value2");
    
    assertEquals(cache.get("key1"), "value1");
    assertEquals(cache.get("key2"), "value2");
    assertEquals(cache.get("key3"), undefined);
  });

  await t.step("should respect max size limit", () => {
    const cache = new LRUCache<number>(3);
    cache.set("a", 1);
    cache.set("b", 2);
    cache.set("c", 3);
    cache.set("d", 4); // Should evict "a"
    
    assertEquals(cache.get("a"), undefined);
    assertEquals(cache.get("b"), 2);
    assertEquals(cache.get("c"), 3);
    assertEquals(cache.get("d"), 4);
  });

  await t.step("should update LRU order on get", () => {
    const cache = new LRUCache<number>(3);
    cache.set("a", 1);
    cache.set("b", 2);
    cache.set("c", 3);
    
    // Access "a" to make it most recently used
    cache.get("a");
    
    // Add new item, should evict "b" (least recently used)
    cache.set("d", 4);
    
    assertEquals(cache.get("a"), 1);
    assertEquals(cache.get("b"), undefined);
    assertEquals(cache.get("c"), 3);
    assertEquals(cache.get("d"), 4);
  });

  await t.step("should handle has() method", () => {
    const cache = new LRUCache<string>();
    cache.set("key1", "value1");
    
    assert(cache.has("key1"));
    assert(!cache.has("key2"));
  });

  await t.step("should handle delete() method", () => {
    const cache = new LRUCache<string>();
    cache.set("key1", "value1");
    cache.set("key2", "value2");
    
    assert(cache.delete("key1"));
    assert(!cache.delete("key3"));
    assertEquals(cache.get("key1"), undefined);
    assertEquals(cache.get("key2"), "value2");
  });

  await t.step("should handle clear() method", () => {
    const cache = new LRUCache<string>();
    cache.set("key1", "value1");
    cache.set("key2", "value2");
    
    cache.clear();
    
    assertEquals(cache.get("key1"), undefined);
    assertEquals(cache.get("key2"), undefined);
    assert(!cache.has("key1"));
    assert(!cache.has("key2"));
  });

  await t.step("should update value for existing key", () => {
    const cache = new LRUCache<string>(3);
    cache.set("key1", "value1");
    cache.set("key2", "value2");
    cache.set("key1", "updated");
    
    assertEquals(cache.get("key1"), "updated");
    assertEquals(cache.get("key2"), "value2");
    
    // After the gets above, order is: key1, key2 (most recent)
    // Now add key3, order becomes: key1, key2, key3
    cache.set("key3", "value3");
    // Adding key4 should evict key1 (least recently used)
    cache.set("key4", "value4");
    
    assertEquals(cache.get("key1"), undefined); // evicted
    assertEquals(cache.get("key2"), "value2"); // still there
    assertEquals(cache.get("key3"), "value3");
    assertEquals(cache.get("key4"), "value4");
  });
});