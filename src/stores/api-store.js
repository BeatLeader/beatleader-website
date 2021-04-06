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
  if (onInitialized) onInitialized({state: processedInitialState, params: fetchParams, defaultParams: defaultFetchParams});

  const {subscribe: subscribeIsLoading, set: setIsLoading} = writable(false);
  const {subscribe: subscribePending, set: setPending} = writable(null);
  const {subscribe: subscribeError, set: setError} = writable(null);

  const fetch = async (fetchParams = null, force = false, provider = currentProvider, signal = null,) => {
    const finalParams = getFinalParams(fetchParams);

    if (currentParamsHash === hash(finalParams) && !force) return;

    try {
      setError(null);
      setIsLoading(true);
      setPending(onSetPending ? onSetPending(fetchParams) : fetchParams);

      state = await provider.getProcessed({...finalParams, ...(signal ? {signal} : null)});
      currentParams = fetchParams;
      currentParamsHash = hash(finalParams);

      set(state)

      if (onAfterStateChange) onAfterStateChange({state, params: currentParams, defaultParams: defaultFetchParams});
    } catch (err) {
      setError(onError ? onError(err) : err);
    } finally {
      setIsLoading(false);
      setPending(null);
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

