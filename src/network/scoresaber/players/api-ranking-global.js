import queue from '../../queues'
import process from './utils/process'

const get = async ({page = 1, priority = queue.PRIORITY.FG_HIGH, signal = null, cacheTtl = null} = {}) => queue.SCORESABER_API.rankingGlobal(page, signal, priority, cacheTtl);

export default {
  get,
  process,
  getProcessed: async ({page = 1, priority = queue.PRIORITY.FG_HIGH, signal = null, cacheTtl = null} = {}) => process(await get({page, priority, signal, cacheTtl})),
}