export const delay = async (time, val, shouldReject = false, signal = null) => new Promise((resolve, reject) => {
  const handle = setTimeout(_ => shouldReject ? reject(val) : resolve(val), time);

  signal?.addEventListener('abort', () => {
    clearTimeout(handle);

    reject(new Error('AbortError'));
  }, {once: true})
});