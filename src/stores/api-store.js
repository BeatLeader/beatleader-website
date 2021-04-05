import {writable} from 'svelte/store'
import stringify from 'json-stable-stringify';

const delay = async (time, val, shouldReject = false) => new Promise((resolve, reject) => setTimeout(_ => shouldReject ? reject(val) : resolve(val), time));

const hash = obj => stringify(obj);

export default (
  provider,
  params = null,
  initialState = null,
  {
    onInitialized = null,
    onAfterStateChange = null,
  } = {},
) => {
  let state = initialState;

  let currentParamsHash = hash(params);

  const processedInitialState = provider.process(initialState);
  const {subscribe, set} = writable(initialState ? processedInitialState : null);
  if (onInitialized) onInitialized({state: processedInitialState, params});

  const {subscribe: subscribeIsLoading, set: setIsLoading} = writable(false);
  const {subscribe: subscribePending, set: setPending} = writable(null);
  const {subscribe: subscribeError, set: setError} = writable(null);

  const fetch = async (params = null, force = false) => {
    if (currentParamsHash === hash(params) && !force) return;

    try {
      setIsLoading(true);
      setPending(params);

      // TODO: test only
      await delay(1000);

      state = await provider.getProcessed(params);
      currentParamsHash = hash(params);

      set(state)

      if (onAfterStateChange) onAfterStateChange({state, params});
    } catch (err) {
      console.error(err);
      setError(err);
    } finally {
      setIsLoading(false);
      setPending(null);
    }

    return true;
  }

  const refetch = async () => {
    if (!params) return false;

    return fetch(params, true);
  }

  if (!initialState && params) fetch(params, true)

  return {
    subscribe,
    fetch,
    refetch,
    getState: () => state,
    isLoading: {subscribe: subscribeIsLoading},
    pending: {subscribe: subscribePending},
    error: {subscribe: subscribeError},
  }
}

