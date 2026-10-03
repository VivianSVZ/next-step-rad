const LOCAL_PREFIX = "nsr:";
const memoryStore = new Map();

function checkLocalStorage() {
  try {
    const testKey = "__nsr_test__";
    localStorage.setItem(testKey, "1");
    localStorage.removeItem(testKey);
    return true;
  } catch (e) {
    return false;
  }
}

const hasLocalStorage = checkLocalStorage();

async function get(key) {
  if (hasLocalStorage) {
    try {
      const raw = localStorage.getItem(LOCAL_PREFIX + key);
      return raw === null ? null : { key, value: raw, shared: false };
    } catch (e) {
      /* fällt durch auf den Arbeitsspeicher-Speicher */
    }
  }
  return memoryStore.has(key) ? { key, value: memoryStore.get(key), shared: false } : null;
}

async function set(key, value) {
  if (hasLocalStorage) {
    try {
      localStorage.setItem(LOCAL_PREFIX + key, value);
      return { key, value, shared: false };
    } catch (e) {
      /* z. B. Speicher blockiert/voll, im Arbeitsspeicher weiterarbeiten */
    }
  }
  memoryStore.set(key, value);
  return { key, value, shared: false };
}

async function del(key) {
  if (hasLocalStorage) {
    try {
      localStorage.removeItem(LOCAL_PREFIX + key);
    } catch (e) {
      /* ignorieren */
    }
  }
  memoryStore.delete(key);
  return { key, deleted: true, shared: false };
}

async function list(prefix) {
  const keys = [];
  if (hasLocalStorage) {
    try {
      for (let i = 0; i < localStorage.length; i++) {
        const k = localStorage.key(i);
        if (k && k.startsWith(LOCAL_PREFIX)) {
          const real = k.slice(LOCAL_PREFIX.length);
          if (!prefix || real.startsWith(prefix)) keys.push(real);
        }
      }
      return { keys, prefix, shared: false };
    } catch (e) {
      /* fällt durch auf den Arbeitsspeicher-Speicher */
    }
  }
  memoryStore.forEach((_, real) => {
    if (!prefix || real.startsWith(prefix)) keys.push(real);
  });
  return { keys, prefix, shared: false };
}

window.storage = { get, set, delete: del, list, isPersistent: hasLocalStorage };
