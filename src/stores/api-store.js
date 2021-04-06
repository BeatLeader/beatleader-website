import {writable} from 'svelte/store'
import stringify from 'json-stable-stringify';

const hash = obj => stringify(obj);

export default (
  provider,
  fetchParams = null,
  initialState = null,
  {
    defaultFetchParams = {},
    onInitialized = null,
    onAfterStateChange = null,
    onSetPending = null,
    onError = null,
    timeout = 10000
  } = {},
) => {
  const getFinalParams = fetchParams => ({...defaultFetchParams, ...fetchParams});

  let state = initialState;
  let currentProvider = provider;

  let currentParams = fetchParams;
  let currentParamsHash = hash(getFinalParams(fetchParams));

  const setProvider = provider => currentProvider = provider;

  const processedInitialState = provider.process(initialState);
  const {subscribe, set} = writable(initialState ? processedInitialState : null);
  if (onInitialized) onInitialized({state: processedInitialState, fetchParams, defaultFetchParams});

  const {subscribe: subscribeIsLoading, set: setIsLoading} = writable(false);
  const {subscribe: subscribePending, set: setPending} = writable(null);
  const {subscribe: subscribeError, set: setError} = writable(null);

  let abortController;

  const fetch = async (fetchParams = null, force = false, provider = currentProvider,) => {
    // abort previous pending fetch if needed
    if (abortController) abortController.abort();

    const finalParams = getFinalParams(fetchParams);

    if (currentParamsHash === hash(finalParams) && !force) return;

    try {
      abortController = new AbortController();

      setError(null);
      setIsLoading(true);
      setPending(onSetPending ? onSetPending({fetchParams, abortController}) : fetchParams);

      const timeoutHandle = setTimeout(() => abortController.abort(), timeout);
      state = await provider.getProcessed({...finalParams, signal: abortController.signal});
      clearTimeout(timeoutHandle);

      currentParams = fetchParams;
      currentParamsHash = hash(finalParams);

      set(state)

      if (onAfterStateChange) onAfterStateChange({state, fetchParams: currentParams, defaultFetchParams});
    } catch (err) {
      setError(onError ? onError(err) : err);
    } finally {
      setIsLoading(false);
      setPending(null);

      abortController = null;
    }

    return true;
  }

  if (!initialState) fetch(fetchParams, true)

  return {
    subscribe,
    fetch,
    getState: () => state,
    getProvider: () => currentProvider,
    getParams: () => currentParams,
    setProvider,
    isLoading: {subscribe: subscribeIsLoading},
    pending: {subscribe: subscribePending},
    error: {subscribe: subscribeError},
  }
}

