const store = new Map();

const setOtp = (key, otp, ttlMs = 5 * 60 * 1000) => {
  const expiresAt = Date.now() + ttlMs;
  store.set(key, { otp, expiresAt });
  setTimeout(() => {
    const item = store.get(key);
    if (item && item.expiresAt <= Date.now()) {
      store.delete(key);
    }
  }, ttlMs + 1000).unref?.();
};

const verifyOtp = (key, otp) => {
  const item = store.get(key);
  if (!item) return false;
  const valid = item.otp === otp && item.expiresAt > Date.now();
  if (valid) store.delete(key);
  return valid;
};

module.exports = { setOtp, verifyOtp };
