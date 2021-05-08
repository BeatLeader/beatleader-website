import apiPlayerInfo from './api-info';
import apiRecentScoresProvider from '../scores/api-recent'
import apiTopScoresProvider from '../scores/api-top'
import {opt} from '../../../utils/js'

const getProviderByType = scoresType => scoresType === 'top' ? apiTopScoresProvider : apiRecentScoresProvider;

const glueComponents = (playerInfo, scores, scoresType) => ({...playerInfo, scores, scoresType});

const process = (response, scoresType) => {
  scoresType = scoresType ? scoresType : opt(response, 'scoresType', null);

  return glueComponents(apiPlayerInfo.process(response), opt(response, 'scores', []), scoresType);
};

const get = async ({playerId, scoresType = 'recent', signal = null} = {}) => {
  let fetchParams = {playerId, signal}
  const responses = await Promise.all([
    apiPlayerInfo.get(fetchParams),
    getProviderByType(scoresType).get(fetchParams),
  ]);

  return glueComponents(responses[0], responses[1], scoresType);
}

export default {
  get,
  process,
  getProcessed: async ({playerId, scoresType = 'recent', signal = null} = {}) => process(await get({playerId, scoresType, signal}), scoresType),
}