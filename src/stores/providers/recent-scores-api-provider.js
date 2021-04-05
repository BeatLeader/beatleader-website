import ssApi from '../../network/ss-api'
import process from './common/process';
import {delay} from '../../utils/promise'

const get = async ({playerId, page = 1, signal = null} = {}) => {
  // TODO: test only
  await delay(1000);

  return ssApi.recentScores(playerId, page, signal);
}

export default {
  get,
  process,
  getProcessed: async ({playerId, page = 1, signal = null} = {}) => process(await get({playerId, page, signal})),
}