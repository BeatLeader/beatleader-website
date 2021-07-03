import createPlayerService from '../../../services/scoresaber/player';
import createScoresService from '../../../services/scoresaber/scores';
import queue from '../../../network/queues'
import {MINUTE, SECOND} from '../../../utils/date'

let playerService = null;
let scoresService = null;

export default () => {
  playerService = createPlayerService();
  scoresService = createScoresService();

  let firstFetch = true;

  return {
    getProcessed: async ({playerId, priority = queue.PRIORITY.FG_HIGH, scoresType = 'recent', scoresPage = 1, signal = null, force = false} = {}) => {
      const refreshInterval = firstFetch ? 5 * SECOND : MINUTE;
      firstFetch = false;

      const player = await playerService.fetchPlayerOrGetFromCache(playerId, refreshInterval, priority, signal, force);

      const scores = await scoresService.fetchScoresPageOrGetFromCache(player, scoresType, scoresPage, refreshInterval, priority, signal, force)

      return {...player, scores, scoresType, scoresPage}
    },

    getCached: async ({playerId, scoresType = 'recent', scoresPage = 1} = {}) => {
      const [player, scores] = await Promise.all([
        playerService.get(playerId),
        scoresService.getPlayerScoresPage(playerId, scoresType, scoresPage)
      ]);

      if (!player || !scores) return null;

      return {...player, scores, scoresType, scoresPage}
    },

    destroy() {},
  }
}