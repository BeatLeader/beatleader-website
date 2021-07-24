import queue from '../../queues'
import process from './utils/process';

const get = async ({playerId, page = 1, priority = queue.PRIORITY.FG_HIGH, signal = null, cacheTtl = null} = {}) => queue.SCORESABER_API.topScores(playerId, page, signal, priority, cacheTtl);

export default {
  get,
  process,
  getProcessed: async ({playerId, page = 1, priority = queue.PRIORITY.FG_HIGH, signal = null, cacheTtl = null} = {}) => process(await get({playerId, page, priority, signal, cacheTtl}), new Date()),
  type: 'top',
}