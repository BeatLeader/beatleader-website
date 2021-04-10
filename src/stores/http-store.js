import {writable} from 'svelte/store'
import stringify from 'json-stable-stringify';
import {delay} from '../utils/promise'

const hash = obj => stringify(obj);

export class TimeoutError extends Error {
  constructor(timeout, message) {
    super(message);

    this.name = "TimeoutError";
    this.timeout = timeout;
  }

  toString() {
    return `Time out Error (${this.timeout}ms)`
  }
}

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
    timeout = 10000,
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

      state = await Promise.race([
        provider.getProcessed({...finalParams, signal: abortController.signal}),
        delay(timeout, new TimeoutError(timeout), true)
      ]);

      currentParams = fetchParams;
      currentParamsHash = hash(finalParams);

      set(state)

      if (onAfterStateChange) onAfterStateChange({state, fetchParams: currentParams, defaultFetchParams});

      return true;
    } catch (err) {
      if (err?.name === 'AbortError' || err?.message === 'AbortError') return false;

      try {
        if (err instanceof TimeoutError && abortController && !abortController.aborted) {
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

