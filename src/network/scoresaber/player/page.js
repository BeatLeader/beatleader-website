import queue from '../../queues'
import api from './api'
import {opt} from '../../../utils/js'

const process = response => {
  const apiProcessedResponse = api.process(response && response.player ? response.player : null);

  if (!opt(response, 'player.playerInfo')) return null;

  const recentPlay = opt(response, 'player.recentPlay');
  const recentPlayLastUpdated = opt(response, 'player.recentPlayLastUpdated');
  if (recentPlay && recentPlayLastUpdated) {
    apiProcessedResponse.playerInfo.recentPlay = recentPlay;
    apiProcessedResponse.playerInfo.recentPlayLastUpdated = recentPlayLastUpdated;
  }

  const externalProfileUrl = opt(response, 'player.playerInfo.externalProfileUrl');
  if (externalProfileUrl) {
    apiProcessedResponse.playerInfo.externalProfileUrl = externalProfileUrl;
  }

  return apiProcessedResponse;
};

const get = async ({playerId, priority = queue.PRIORITY.FG_HIGH, signal = null} = {}) => queue.SCORESABER_PAGE.player(playerId, signal, priority);

export default {
  get,
  process,
  getProcessed: async ({playerId, priority = queue.PRIORITY.FG_HIGH, signal = null} = {}) => process(await get({playerId, priority, signal})),
}