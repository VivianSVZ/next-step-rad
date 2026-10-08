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
      return raw === null ? null : { key, value: raw };
    } catch (e) {
    
    }
  }
  return memoryStore.has(key) ? { key, value: memoryStore.get(key) } : null;
}

async function set(key, value) {
  if (hasLocalStorage) {
    try {
      localStorage.setItem(LOCAL_PREFIX + key, value);
      return { key, value };
    } catch (e) {
    
    }
  }
  memoryStore.set(key, value);
  return { key, value };
}

window.storage = { get, set, isPersistent: hasLocalStorage };
