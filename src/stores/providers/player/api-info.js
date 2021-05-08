import ssApi, {SS_API_HOST} from '../../../network/scoresaber/api'
import {opt} from '../../../utils/js'

const process = response => {
  if (!opt(response, 'playerInfo')) return null;

  const {playerInfo: info, scoreStats} = response;
  const {country, countryRank, avatar, permissions, ...playerInfo} = info;

  if (avatar && !avatar.startsWith('http'))
    playerInfo.avatar = `${SS_API_HOST}${!avatar.startsWith('/') ? '/' : ''}${avatar}`;

  playerInfo.externalProfileUrl = null;
  playerInfo.countries = [{country, rank: countryRank}];

  return {playerInfo, scoreStats: scoreStats ?? null};
};

const get = async ({playerId, signal = null} = {}) => ssApi.player(playerId, signal);

export default {
  get,
  process,
  getProcessed: async ({playerId, signal = null} = {}) => process(await get({playerId, signal})),
  type: 'top',
}