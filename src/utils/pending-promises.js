export default () => {
  let pendingPromises = {};

  return async (promiseKey, promiseReturningFunc) => {
    if (!pendingPromises[promiseKey]) {
      pendingPromises[promiseKey] = promiseReturningFunc()
        .then(res => {
          delete pendingPromises[promiseKey];

          return res;
        });
    }

    return pendingPromises[promiseKey]
  }
}