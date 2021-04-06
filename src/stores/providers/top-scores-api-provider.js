import ssApi from '../../network/ss-api'
import process from './common/process';

const get = async ({playerId, page = 1, signal = null} = {}) => ssApi.topScores(playerId, page, signal);

export default {
  get,
  process,
  getProcessed: async ({playerId, page = 1, signal = null} = {}) => process(await get({playerId, page, signal})),
  type: 'top',
}