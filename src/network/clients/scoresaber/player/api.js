import queue from '../../../queues/queues'
import createClient from '../../generic'
import {opt} from '../../../../utils/js'

const process = response => {
  const {id: playerId, name, country, countryRank, badges, profilePicture, permissions, pp, rank, banned, inactive, histories: history, scoreStats} = response[0];
  
  var avatar = profilePicture;
  let stemProfile = response[1].response.players.length != 0;
  if (stemProfile) {
    avatar = response[1].response.players[0].avatarfull;
  }
  let externalProfileUrl = stemProfile ? response[1].response.players[0].profileurl : null;
  let externalProfileCorsUrl = externalProfileUrl
  
  return {playerId, name, playerInfo: {
    avatar,
    externalProfileUrl,
    externalProfileCorsUrl,
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

const get = async ({playerId, priority = queue.PRIORITY.FG_HIGH, ...queueOptions} = {}) => Promise.all([
  queue.SCORESABER_API.player(playerId, priority, queueOptions),
  queue.SCORESABER_API.steamProfile(playerId, priority, queueOptions)]);

const client = createClient(get, process);

export default client;
