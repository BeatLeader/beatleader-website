import queue from '../../../queues/queues'
import createClient from '../../generic'
import {opt} from '../../../../utils/js'

const process = response => {
  if (!opt(response, 'playerInfo')) return null;

  const {playerInfo: info, scoreStats} = response;
  const {playerId, playerName: name, country, countryRank, avatar, permissions, ...playerInfo} = info;

  if (avatar) {
    if (!avatar.startsWith('http'))
      playerInfo.avatar = `${queue.SCORESABER_API.SS_API_HOST}${!avatar.startsWith('/') ? '/' : ''}${avatar}`;
    else
      playerInfo.avatar = avatar;
  }

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

const get = async ({playerId, priority = queue.PRIORITY.FG_HIGH, ...queueOptions} = {}) => queue.SCORESABER_API.player(playerId, priority, queueOptions);

const client = createClient(get, process);

export default {
  ...client,
  type: 'scoresaber/top',
}
