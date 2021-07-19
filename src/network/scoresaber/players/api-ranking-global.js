import queue from '../../queues'
import process from './utils/process'

const get = async ({page = 1, priority = queue.PRIORITY.FG_HIGH, signal = null} = {}) => queue.SCORESABER_API.rankingGlobal(page, signal, priority);

export default {
  get,
  process,
  getProcessed: async ({page = 1, priority = queue.PRIORITY.FG_HIGH, signal = null} = {}) => process(await get({page, priority, signal})),
}