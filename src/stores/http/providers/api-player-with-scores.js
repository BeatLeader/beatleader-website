import createPlayerService from '../../../services/beatleader/player';
import createScoresFetcher from './utils/scores-fetch'
import queue from '../../../network/queues/queues'
import {MINUTE, SECOND} from '../../../utils/date'
import {worker} from '../../../utils/worker-wrappers'

let playerService = null;
let scoresFetcher = null;

export default () => {
  playerService = createPlayerService();
  scoresFetcher = createScoresFetcher();

  let firstFetch = true;

  return {
    getProcessed: async ({playerId, priority = queue.PRIORITY.FG_HIGH, service = 'beatleader', serviceParams = {sort: 'recent', order: 'desc', page: 1}, signal = null, force = false} = {}) => {
      const refreshInterval = firstFetch ? 5 * SECOND : MINUTE;
      firstFetch = false;

      const player = await playerService.fetchPlayerOrGetFromCache(playerId, refreshInterval, priority, signal, force);

      const scores = await scoresFetcher.fetchLiveScores(player, service, serviceParams, {refreshInterval, priority, signal, force});

      return {...player, scores, service, serviceParams}
    },

    getCached: async ({playerId, service = 'beatleader', serviceParams = {sort: 'recent', order: 'desc', page: 1}} = {}) => {
      const [player, scores] = await Promise.all([
        playerService.get(playerId),
        scoresFetcher.fetchCachedScores(playerId, service, serviceParams)
      ]);

      if (!player || !scores) return null;

      if (worker) worker.calcPlayerStats(playerId);

      return {...player, scores, service, serviceParams}
    },

    destroy() {
      // TODO: destroy scoresFetcher & playerService
    },
  }
}