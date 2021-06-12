import queue from '../../queues'
import {opt} from '../../../utils/js'

const process = response => {
  if (!opt(response, 'playerInfo')) return null;

  const {playerInfo: info, scoreStats} = response;
  const {playerId, playerName: name, country, countryRank, avatar, permissions, ...playerInfo} = info;

  if (avatar && !avatar.startsWith('http'))
    playerInfo.avatar = `${queue.SCORESABER_API.SS_API_HOST}${!avatar.startsWith('/') ? '/' : ''}${avatar}`;

  playerInfo.banned = !!playerInfo.banned;
  playerInfo.inactive = !!playerInfo.inactive;
  playerInfo.rankHistory = playerInfo.history && playerInfo.history.length
    ? playerInfo.history.split(',').map(r => parseInt(r, 10)).filter(r => !isNaN(r))
    : [];
  delete playerInfo.history;

  playerInfo.externalProfileUrl = null;
  playerInfo.countries = [{country, rank: countryRank}];

  return {playerId, name, playerInfo, scoreStats: scoreStats ? scoreStats : null};
};

const get = async ({playerId, signal = null} = {}) => queue.SCORESABER_API.player(playerId, signal, queue.PRIORITY.FG_HIGH);

export default {
  get,
  process,
  getProcessed: async ({playerId, signal = null} = {}) => process(await get({playerId, signal})),
  type: 'top',
}