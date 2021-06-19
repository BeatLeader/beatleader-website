import apiPlayerInfo from '../../../network/scoresaber/player/api-info';
import apiRecentScoresProvider from '../../../network/scoresaber/scores/api-recent'
import apiTopScoresProvider from '../../../network/scoresaber/scores/api-top'
import createPlayerService from '../../../services/scoresaber/player';
import queue from '../../../network/queues'

let playerService = null;

const getProviderByType = scoresType => scoresType === 'top' ? apiTopScoresProvider : apiRecentScoresProvider;

export default () => {
  playerService = createPlayerService();

  return {
    getProcessed: async ({playerId, priority = queue.PRIORITY.FG_HIGH, scoresType = 'recent', scoresPage = 1, signal = null} = {}) => {
      const fetchParams = {playerId, priority, signal, page: scoresPage}

      const [player, scores] = await Promise.all([
        apiPlayerInfo.getProcessed(fetchParams),
        getProviderByType(scoresType).getProcessed(fetchParams),
      ]);

      return {...player, scores, scoresType, scoresPage}
    },
  }
}