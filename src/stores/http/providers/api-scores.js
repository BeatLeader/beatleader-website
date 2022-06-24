import createPlayerService from '../../../services/beatleader/player';
import createScoresFetcher from './utils/scores-fetch'
import queue from '../../../network/queues/queues'
import {MINUTE} from '../../../utils/date'

let playerService = null;
let scoresFetcher = null;

export default () => {
  let player;

  playerService = createPlayerService();
  scoresFetcher = createScoresFetcher();

  const getProcessed = async ({playerId, service = 'beatleader', serviceParams = {sort: 'date', order: 'desc', page: 1}, priority = queue.PRIORITY.FG_HIGH, signal = null, force = false} = {}) => {
    if (!player || player.playerId !== playerId)
      player = await playerService.fetchPlayerOrGetFromCache(playerId, MINUTE, priority, signal);

    return scoresFetcher.fetchLiveScores(player, service, serviceParams, {refreshInterval: MINUTE, priority, signal, force});
  }

  return {
    getProcessed,
    getCached: getProcessed,

    setPlayer(newPlayer) {
      player = newPlayer
    },

    destroy() {
      playerService.destroyService();
    }
  }
}
