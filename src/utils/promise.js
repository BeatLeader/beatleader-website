export const AbortError = (message = "Aborted") => new DOMException(message, "AbortError");

export const delay = async (time, val, shouldReject = false, signal = null) => new Promise((resolve, reject) => {
  const handle = setTimeout(_ => shouldReject ? reject(val) : resolve(val), time);

  if (signal && signal.addEventListener)
    signal.addEventListener('abort', () => {
      clearTimeout(handle);

      reject(AbortError());
    }, {once: true})
});