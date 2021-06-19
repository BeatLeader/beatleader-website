import apiRecentScoresProvider from '../../../network/scoresaber/scores/api-recent'
import apiTopScoresProvider from '../../../network/scoresaber/scores/api-top'
import createPlayerService from '../../../services/scoresaber/player';
import queue from '../../../network/queues'
import {MINUTE} from '../../../utils/date'

let playerService = null;

const getProviderByType = scoresType => scoresType === 'top' ? apiTopScoresProvider : apiRecentScoresProvider;

export default () => {
  playerService = createPlayerService();

  return {
    getProcessed: async ({playerId, priority = queue.PRIORITY.FG_HIGH, scoresType = 'recent', scoresPage = 1, signal = null} = {}) => {
      const fetchParams = {playerId, priority, signal, page: scoresPage}

      const [player, scores] = await Promise.all([
        playerService.fetchPlayerOrGetFromCache(playerId, MINUTE, priority, signal),
        getProviderByType(scoresType).getProcessed(fetchParams),
      ]);

      return {...player, scores, scoresType, scoresPage}
    },
  }
}