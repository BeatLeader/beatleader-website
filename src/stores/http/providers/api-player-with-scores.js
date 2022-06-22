import createPlayerService from '../../../services/beatleader/player';
import createScoresFetcher from './utils/scores-fetch'
import queue from '../../../network/queues/queues'
import {MINUTE, SECOND} from '../../../utils/date'

let playerService = null;
let scoresFetcher = null;

export default () => {
  playerService = createPlayerService();
  scoresFetcher = createScoresFetcher();

  let firstFetch = true;

  return {
    getProcessed: async ({playerId, priority = queue.PRIORITY.FG_HIGH, service = 'beatleader', serviceParams = {sort: 'date', order: 'desc', page: 1}, signal = null, force = false} = {}) => {
      const refreshInterval = firstFetch ? 5 * SECOND : MINUTE;
      firstFetch = false;

      const player = await playerService.fetchPlayerOrGetFromCache(playerId, refreshInterval, priority, signal, force);

      const scores = await scoresFetcher.fetchLiveScores(player, service, serviceParams, {refreshInterval, priority, signal, force});

      return {...player, scores, service, serviceParams}
    },

    getCached: async ({playerId, service = 'beatleader', serviceParams = {sort: 'date', order: 'desc', page: 1}} = {}) => {
      const [player, scores] = await Promise.all([
        playerService.get(playerId),
        scoresFetcher.fetchCachedScores(playerId, service, serviceParams)
      ]);

      if (!player || !scores) return null;

      return {...player, scores, service, serviceParams}
    },

    destroy() {
      // TODO: destroy scoresFetcher & playerService
    },
  }
}