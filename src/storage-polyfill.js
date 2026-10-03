const LOCAL_PREFIX = "nsr:";

async function get(key) {
  const raw = localStorage.getItem(LOCAL_PREFIX + key);
  if (raw === null) return null;
  return { key, value: raw, shared: false };
}

async function set(key, value) {
  localStorage.setItem(LOCAL_PREFIX + key, value);
  return { key, value, shared: false };
}

async function del(key) {
  localStorage.removeItem(LOCAL_PREFIX + key);
  return { key, deleted: true, shared: false };
}

async function list(prefix) {
  const keys = [];
  for (let i = 0; i < localStorage.length; i++) {
    const k = localStorage.key(i);
    if (k && k.startsWith(LOCAL_PREFIX)) {
      const real = k.slice(LOCAL_PREFIX.length);
      if (!prefix || real.startsWith(prefix)) keys.push(real);
    }
  }
  return { keys, prefix, shared: false };
}

window.storage = { get, set, delete: del, list };
