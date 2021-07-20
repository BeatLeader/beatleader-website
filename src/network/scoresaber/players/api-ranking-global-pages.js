import queue from '../../queues'
import {opt} from '../../../utils/js'

const process = response => opt(response, 'pages', null)

const get = async ({priority = queue.PRIORITY.FG_HIGH, signal = null} = {}) => queue.SCORESABER_API.rankingGlobalPages(signal, priority);

export default {
  get,
  process,
  getProcessed: async ({priority = queue.PRIORITY.FG_HIGH, signal = null} = {}) => process(await get({priority, signal})),
}