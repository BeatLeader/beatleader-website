import queue from '../../../queues/queues'
import createClient from '../../generic'
import {opt} from '../../../../utils/js'

const process = response => {
  const {id: playerId, name, country, countryRank, profilePicture: avatar, permissions, pp, rank, banned, inactive, histories: history, scoreStats} = response;

  return {playerId, name, playerInfo: {
    avatar,
    countries: [{country, rank: countryRank}],
    pp,
    banned,
    inactive,
    rank,
    rankHistory: history && history.length
      ? history.split(',').map(r => parseInt(r, 10)).filter(r => !isNaN(r))
      : [],
  }, scoreStats: scoreStats ? scoreStats : null};
};

const get = async ({playerId, priority = queue.PRIORITY.FG_HIGH, ...queueOptions} = {}) => queue.SCORESABER_API.player(playerId, priority, queueOptions);

const client = createClient(get, process);

export default client;
