import queue from '../../../network/queues'
import {opt} from '../../../utils/js'

const process = response => {
  if (!opt(response, 'playerInfo')) return null;

  const {playerInfo: info, scoreStats} = response;
  const {country, countryRank, avatar, permissions, ...playerInfo} = info;

  if (avatar && !avatar.startsWith('http'))
    playerInfo.avatar = `${queue.SCORESABER_API.SS_API_HOST}${!avatar.startsWith('/') ? '/' : ''}${avatar}`;

  playerInfo.externalProfileUrl = null;
  playerInfo.countries = [{country, rank: countryRank}];

  return {playerInfo, scoreStats: scoreStats ? scoreStats : null};
};

const get = async ({playerId, signal = null} = {}) => queue.SCORESABER_API.player(playerId, signal);

export default {
  get,
  process,
  getProcessed: async ({playerId, signal = null} = {}) => process(await get({playerId, signal})),
  type: 'top',
}