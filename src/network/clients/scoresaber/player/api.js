import queue from '../../../queues/queues'
import createClient from '../../generic'
import {opt} from '../../../../utils/js'

const process = response => {
  const {id: playerId, name, country, countryRank, badges, profilePicture, permissions, pp, rank, banned, inactive, histories: history, scoreStats} = response;
  
  var avatar = profilePicture;
  let externalProfileUrl = playerId > 70000000000000000 ? "https://steamcommunity.com/profiles/" + playerId : null;
  
  return {playerId, name, playerInfo: {
    avatar,
    externalProfileUrl,
    countries: [{country, rank: countryRank}],
    pp,
    banned,
    inactive,
    rank,
    badges,
    rankHistory: history && history.length
      ? history.split(',').map(r => parseInt(r, 10)).filter(r => !isNaN(r))
      : [],
  }, scoreStats: scoreStats ? scoreStats : null};
};

const get = async ({playerId, priority = queue.PRIORITY.FG_HIGH, ...queueOptions} = {}) => queue.SCORESABER_API.player(playerId, priority, queueOptions);

const client = createClient(get, process);

export default client;
