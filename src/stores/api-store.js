import {writable} from 'svelte/store'
import stringify from 'json-stable-stringify';

const hash = obj => stringify(obj);

export default (
  provider,
  fetchParams = null,
  initialState = null,
  {
    defaultParams: defaultFetchParams = {},
    onInitialized = null,
    onAfterStateChange = null,
  } = {},
) => {
  let state = initialState;

  const getFinalParams = fetchParams => ({...defaultFetchParams, ...fetchParams});

  let currentParamsHash = hash(getFinalParams(fetchParams));

  const processedInitialState = provider.process(initialState);
  const {subscribe, set} = writable(initialState ? processedInitialState : null);
  if (onInitialized) onInitialized({state: processedInitialState, params: fetchParams, defaultParams: defaultFetchParams});

  const {subscribe: subscribeIsLoading, set: setIsLoading} = writable(false);
  const {subscribe: subscribePending, set: setPending} = writable(null);
  const {subscribe: subscribeError, set: setError} = writable(null);

  const fetch = async (fetchParams = null, force = false) => {
    const finalParams = getFinalParams(fetchParams);

    if (currentParamsHash === hash(finalParams) && !force) return;

    try {
      setIsLoading(true);
      setPending(fetchParams);

      state = await provider.getProcessed(finalParams);
      currentParamsHash = hash(finalParams);

      set(state)

      if (onAfterStateChange) onAfterStateChange({state, params: fetchParams, defaultParams: defaultFetchParams});
    } catch (err) {
      setError(err);
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
    isLoading: {subscribe: subscribeIsLoading},
    pending: {subscribe: subscribePending},
    error: {subscribe: subscribeError},
  }
}

