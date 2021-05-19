import {writable} from 'svelte/store'
import stringify from 'json-stable-stringify';
import {opt} from '../utils/js'
import {SsrNetworkTimeoutError} from '../network/errors'

const hash = obj => stringify(obj);

export default (
  provider,
  fetchParams = {},
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
  if (onInitialized) onInitialized({state: processedInitialState, fetchParams, defaultFetchParams});

  const {subscribe: subscribeIsLoading, set: setIsLoading} = writable(false);
  const {subscribe: subscribePending, set: setPending} = writable(null);
  const {subscribe: subscribeError, set: setError} = writable(null);

  let pendingAbortController;

  const fetch = async (fetchParams = {}, force = false, provider = currentProvider) => {
    const abortController = new AbortController();

    try {
      // abort previous pending fetch if needed
      if (pendingAbortController) pendingAbortController.abort();

      const finalParams = getFinalParams(fetchParams);

      if (currentParamsHash === hash(finalParams) && !force) return false;

      setError(null);
      setIsLoading(true);
      setPending(onSetPending ? onSetPending({fetchParams, abortController}) : fetchParams);

      pendingAbortController = abortController;

      state = await provider.getProcessed({...finalParams, signal: abortController.signal});

      currentParams = fetchParams;
      currentParamsHash = hash(finalParams);

      set(state)

      if (onAfterStateChange) onAfterStateChange({state, fetchParams: currentParams, defaultFetchParams});

      return true;
    } catch (err) {
      if ([opt(err, 'name'), opt(err, 'message')].includes('AbortError')) return false;

      try {
        if (err instanceof SsrNetworkTimeoutError && abortController && !abortController.aborted) {
          abortController.abort();
        }
      } catch (e) {
        // swallow AbortError
      }

      setError(onError ? onError(err) : err);
    } finally {
      if (abortController === pendingAbortController) {
        pendingAbortController = null;

        setIsLoading(false);
        setPending(null);
      }
    }

    return false;
  }

  if (!initialState && fetchParams) fetch(fetchParams, true);

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

