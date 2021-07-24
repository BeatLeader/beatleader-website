import queue from '../../queues'
import process from './utils/process'

const get = async ({query, priority = queue.PRIORITY.FG_HIGH, signal = null, cacheTtl = null} = {}) => queue.SCORESABER_API.findPlayer(query, signal, priority, cacheTtl);

export default {
  get,
  process,
  getProcessed: async ({query, priority = queue.PRIORITY.FG_HIGH, signal = null, cacheTtl = null} = {}) => process(await get({query, priority, signal, cacheTtl})),
}