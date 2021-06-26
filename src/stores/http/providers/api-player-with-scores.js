import createPlayerService from '../../../services/scoresaber/player';
import createScoresService from '../../../services/scoresaber/scores';
import queue from '../../../network/queues'
import {MINUTE} from '../../../utils/date'

let playerService = null;
let scoresService = null;

export default () => {
  playerService = createPlayerService();
  scoresService = createScoresService();

  return {
    getProcessed: async ({playerId, priority = queue.PRIORITY.FG_HIGH, scoresType = 'recent', scoresPage = 1, signal = null} = {}) => {
      // TODO: find a way to force refreshing when user press reload button

      // TODO: force refresh scores for currently displayed profile (add a add/removeVisiblePlayer() method to download-manager maybe?)

      // TODO: and then increase refresh interval if player has not played recently (last 30 mins?)
      const player = await playerService.fetchPlayerOrGetFromCache(playerId, MINUTE, priority, signal);

      const scores = await scoresService.fetchScoresPageOrGetFromCache(player, scoresType, scoresPage, MINUTE, priority, signal)

      return {...player, scores, scoresType, scoresPage}
    },

    destroy() {},
  }
}