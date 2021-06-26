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
    getProcessed: async ({playerId, priority = queue.PRIORITY.FG_HIGH, scoresType = 'recent', scoresPage = 1, signal = null} = {}) => {
      // TODO: force refresh scores for currently displayed profile (add a add/removeVisiblePlayer() method to download-manager maybe?)
      // TODO: and then increase refresh interval if player has not played recently (last 30 mins?)

      const refreshInterval = firstFetch ? 5 * SECOND : MINUTE;
      firstFetch = false;

      const player = await playerService.fetchPlayerOrGetFromCache(playerId, refreshInterval, priority, signal);

      const scores = await scoresService.fetchScoresPageOrGetFromCache(player, scoresType, scoresPage, refreshInterval, priority, signal)

      return {...player, scores, scoresType, scoresPage}
    },

    destroy() {},
  }
}