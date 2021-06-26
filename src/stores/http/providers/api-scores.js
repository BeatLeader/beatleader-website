import createPlayerService from '../../../services/scoresaber/player';
import createScoresService from '../../../services/scoresaber/scores';
import queue from '../../../network/queues'
import {MINUTE} from '../../../utils/date'

let playerService = null;
let scoresService = null;

export default () => {
  let player;

  playerService = createPlayerService();
  scoresService = createScoresService();

  return {
    async getProcessed({playerId, type = 'recent', page = 1, priority = queue.PRIORITY.FG_HIGH, signal = null} = {}) {
      // TODO: test only, remove it. update player when changed (subscribe)
      player = await playerService.fetchPlayerOrGetFromCache(playerId, MINUTE, priority, signal);

      return scoresService.fetchScoresPageOrGetFromCache(player, type, page, MINUTE, priority, signal);
    },

    setPlayer(player) {

    },

    destroy() {
      // TODO: unsubscribe from player updates
    }
  }
}
