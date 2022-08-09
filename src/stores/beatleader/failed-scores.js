import { writable } from 'svelte/store'
import { BL_API_URL } from '../../network/queues/beatleader/api-queue'
import process from '../../network/clients/beatleader/scores/utils/process';

let store = null;
let storeSubCount = 0;
export default (refreshOnCreate = true) => {
  storeSubCount++;
  if (store) return store;

  let totalScores = {};

  const get = () => totalScores;
  const { subscribe: subscribeState, set } = writable(totalScores);

  const fetchScores = async (page) => {
    fetch(BL_API_URL + "user/failedScores?page=" + page, { credentials: 'include' })
      .then(response => response.json())
      .then(data => process(data))
      .then(data => {
        totalScores.scores = data.data;
        totalScores.metadata = data.metadata;
        set(totalScores);
      })
  }

  const deleteScore = async (id) => {
    totalScores.scores = totalScores.scores.filter(s => s.score.id != id);
    set(totalScores);

    fetch(BL_API_URL + "user/failedscore/remove?id=" + id, { credentials: 'include', method: 'POST' })
      .then(() => {
        fetchScores();
      })
  }

  const retryScore = async (id) => {
    totalScores.scores = totalScores.scores.filter(s => s.score.id != id);
    set(totalScores);

    fetch(BL_API_URL + "user/failedscore/retry?id=" + id, { credentials: 'include', method: 'POST' })
      .then(() => {
        fetchScores();
      })
  }

  const refresh = async () => fetchScores(1);

  const subscribe = fn => {
    const stateUnsubscribe = subscribeState(fn);

    return () => {
      storeSubCount--;

      if (storeSubCount === 0) {
        store = null;

        stateUnsubscribe();
      }
    }
  }

  return {
    subscribe,
    get,
    refresh,
    deleteScore,
    retryScore,
    fetchScores
  }
}

