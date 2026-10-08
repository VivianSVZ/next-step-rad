export async function storageGet(key) {
  try {
    const res = await window.storage.get(key);
    return res ? res.value : null;
  } catch (e) {
    return null;
  }
}

export async function storageSet(key, value) {
  try {
    await window.storage.set(key, value);
    return true;
  } catch (e) {
    return false;
  }
}
