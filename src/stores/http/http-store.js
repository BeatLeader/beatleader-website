import {writable} from 'svelte/store';
import stringify from 'json-stable-stringify';
import {SsrNetworkTimeoutError} from '../../network/errors';
import {deepClone} from '../../utils/js';

const hash = obj => stringify(obj);

export default (
	provider,
	fetchParams = {},
	initialState = null,
	{
		defaultFetchParams = {},
		onInitialized = null,
		onBeforeStateChange = null,
		onAfterStateChange = null,
		onSetPending = null,
		onError = null,
	} = {},
	initialStateType = 'initial'
) => {
	const getFinalParams = fetchParams => ({...defaultFetchParams, ...fetchParams});

	let stateType = initialStateType;
	let state = initialState;
	let currentProvider = provider;

	let currentParams = fetchParams;
	let currentParamsHash = hash(getFinalParams(fetchParams));

	const setProvider = provider => (currentProvider = provider);

	const {subscribe: subscribeState, set} = writable(state);
	if (onInitialized) onInitialized({state, stateType, fetchParams, defaultFetchParams, set});

	const {subscribe: subscribeIsLoading, set: setIsLoading} = writable(false);
	const {subscribe: subscribePending, set: setPending} = writable(null);
	const {subscribe: subscribeError, set: setError} = writable(null);

	let pendingAbortController;

	const fetch = async (fetchParams = {}, force = false, provider = currentProvider, fetchCachedFirst = false) => {
		const abortController = new AbortController();

		try {
			// abort previous pending fetch if needed
			// if (pendingAbortController) pendingAbortController.abort();

			const finalParams = getFinalParams(fetchParams);

			if (currentParamsHash === hash(finalParams) && !force) return false;

			if (fetchCachedFirst) {
				const beforeState = state;

				provider.getCached({...finalParams, force}).then(cachedState => {
					if (cachedState && beforeState === state) {
						state = cachedState;
						set(onBeforeStateChange ? onBeforeStateChange(cachedState, stateType) : cachedState);
					}
				});
			}

			setError(null);
			setIsLoading(true);
			setPending(onSetPending ? onSetPending({fetchParams, abortController}) : fetchParams);

			pendingAbortController = abortController;

			stateType = 'live';
			state = await provider.getProcessed({...finalParams, signal: abortController.signal, force});

			currentParams = fetchParams;
			currentParamsHash = hash(finalParams);

			set(onBeforeStateChange ? onBeforeStateChange(state, stateType) : state);

			if (onAfterStateChange) onAfterStateChange({state, stateType, fetchParams: currentParams, defaultFetchParams, set});

			return true;
		} catch (err) {
			if ([err?.name, err?.message].includes('AbortError')) return false;

			try {
				if (err instanceof SsrNetworkTimeoutError && abortController && !abortController.aborted) {
					abortController.abort();
				}
			} catch (e) {
				// swallow AbortError
			}

			console.log(err);

			setError(onError ? onError(err) : err);
		} finally {
			if (abortController === pendingAbortController) {
				pendingAbortController = null;

				setIsLoading(false);
				setPending(null);
			}
		}

		return false;
	};

	if (!initialState && fetchParams) fetch(fetchParams, true, currentProvider, true);

	const subscribe = fn => {
		const stateUnsubscribe = subscribeState(fn);

		return () => {
			stateUnsubscribe();

			if (currentProvider.destroy) currentProvider.destroy();
		};
	};

	return {
		subscribe,
		fetch,
		getState: () => state,
		getStateType: () => stateType,
		getProvider: () => currentProvider,
		getParams: () => currentParams,
		setProvider,
		isLoading: {subscribe: subscribeIsLoading},
		pending: {subscribe: subscribePending},
		error: {subscribe: subscribeError},
	};
};
