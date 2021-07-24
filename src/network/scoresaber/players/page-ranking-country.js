import queue from '../../queues'
import api from './api-ranking-global'
import {opt} from '../../../utils/js'

const process = response => {
  const apiProcessedResponse = api.process(response);

  if (!opt(response, 'players')) return null;

  return apiProcessedResponse;
}

const get = async ({country, page = 1, priority = queue.PRIORITY.FG_HIGH, signal = null, cacheTtl = null} = {}) => queue.SCORESABER_PAGE.countryRanking(country, page, signal, priority, cacheTtl);

export default {
  get,
  process,
  getProcessed: async ({country, page = 1, priority = queue.PRIORITY.FG_HIGH, signal = null, cacheTtl = null} = {}) => process(await get({country, page, priority, signal, cacheTtl})),
}