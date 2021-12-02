import queue from '../../../queues/queues'
import api from './api-ranking-global'
import {opt} from '../../../../utils/js'
import createClient from '../../generic'

const process = response => {
  const apiProcessedResponse = response.players;

  if (!opt(response, 'players')) return null;

  return apiProcessedResponse;
}

const get = async ({country, page = 1, priority = queue.PRIORITY.FG_HIGH, ...queueOptions} = {}) => queue.SCORESABER_PAGE.countryRanking(country, page, priority, queueOptions);

const client = createClient(get, process);

export default client;