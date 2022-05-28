export default () => {
  let pendingPromises = {};

  return async (promiseKey, promiseReturningFunc) => {
    if (!pendingPromises[promiseKey]) {
      pendingPromises[promiseKey] = promiseReturningFunc()
        .then(res => {
          delete pendingPromises[promiseKey];

          return res;
        })
        .catch(err => {
          delete pendingPromises[promiseKey];

          throw err;
        });
    }

    return pendingPromises[promiseKey]
  }
}