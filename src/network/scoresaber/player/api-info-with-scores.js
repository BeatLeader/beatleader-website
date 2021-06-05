import apiPlayerInfo from './api-info';
import apiRecentScoresProvider from '../scores/api-recent'
import apiTopScoresProvider from '../scores/api-top'
import {opt} from '../../../utils/js'

const getProviderByType = scoresType => scoresType === 'top' ? apiTopScoresProvider : apiRecentScoresProvider;

const glueComponents = (playerInfo, scores, scoresType, scoresPage) => ({...playerInfo, scores, scoresType, scoresPage});

const process = (response, scoresType, scoresPage = 1) => {
  scoresType = scoresType ? scoresType : opt(response, 'scoresType', null);
  scoresPage = scoresPage ? scoresPage : opt(response, 'scoresPage', 1);

  return glueComponents(apiPlayerInfo.process(response), opt(response, 'scores', []), scoresType, scoresPage);
};

const get = async ({playerId, scoresType = 'recent', scoresPage = 1, signal = null} = {}) => {
  let fetchParams = {playerId, signal, page: scoresPage}
  const responses = await Promise.all([
    apiPlayerInfo.get(fetchParams),
    getProviderByType(scoresType).get(fetchParams),
  ]);

  return glueComponents(responses[0], responses[1], scoresType, scoresPage);
}

export default {
  get,
  process,
  getProcessed: async ({playerId, scoresType = 'recent', scoresPage = 1, signal = null} = {}) => process(await get({playerId, scoresType, scoresPage, signal}), scoresType, scoresPage),
}