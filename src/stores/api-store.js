import {writable} from 'svelte/store'

const delay = async (time, val, shouldReject = false) => new Promise((resolve, reject) => setTimeout(_ => shouldReject ? reject(val) : resolve(val), time));

export default (scoresProvider, playerId = null, page = 1, initialState = null) => {
  let state = initialState;
  let currentPlayerId = playerId;
  let currentPage = page ?? 1;

  const {subscribe, set} = writable(initialState ? scoresProvider.process(initialState) : null);

  const {subscribe: subscribeIsLoading, set: setIsLoading} = writable(false);
  const {subscribe: subscribePending, set: setPending} = writable(null);
  const {subscribe: subscribeError, set: setError} = writable(null);

  const fetch = async (page, playerId = currentPlayerId, force = false) => {
    if (page === currentPage && playerId === currentPlayerId && !force) return;

    console.log(`${playerId} / ${page}`)

    try {
      setIsLoading(true);
      setPending({playerId, page});

      // TODO: test only
      await delay(1000);

      state = await scoresProvider.getProcessed({playerId, page});

      currentPage = page;
      currentPlayerId = playerId;

      set(state)
    }
    catch(err) {
      console.error(err);
      setError(err);
    }
    finally {
      setIsLoading(false);
      setPending(null);
    }

    return true;
  }

  const refetch = async () => {
    if (!currentPlayerId || !currentPage) return false;

    return fetch(currentPage, currentPlayerId, true);
  }

  if (currentPlayerId && !initialState) fetch(currentPage, currentPlayerId, true)

  return {
    subscribe,
    fetch,
    refetch,
    getState: () => state,
    getPlayerId: () => currentPlayerId,
    getPage: () => currentPage,
    isLoading: {subscribe: subscribeIsLoading},
    pending: {subscribe: subscribePending},
    error: {subscribe: subscribeError},
  }
}

