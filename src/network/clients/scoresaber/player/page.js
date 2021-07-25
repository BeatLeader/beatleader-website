import queue from '../../../queues/queues'
import api from './api'
import {opt} from '../../../../utils/js'
import createClient from '../../generic'

const process = response => {
  const apiProcessedResponse = api.process(response && response.player ? response.player : null);

  if (!opt(apiProcessedResponse, 'player.playerInfo')) return null;

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

const get = async ({playerId, priority = queue.PRIORITY.FG_HIGH, ...queueOptions} = {}) => queue.SCORESABER_PAGE.player(playerId, priority, queueOptions);

const client = createClient(get, process);

export default client;