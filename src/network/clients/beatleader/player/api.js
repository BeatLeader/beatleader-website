import queue from '../../../queues/queues'
import createClient from '../../generic'
import {opt} from '../../../../utils/js'

const process = response => {
  const {id: playerId, name, country, countryRank, badges, avatar, permissions, pp, rank, banned, inactive, histories: history, scoreStats} = response[0];
  
  let profilePicture = avatar.replace("cdn.beatleader.xyz", "beatleader3.azureedge.net");
  let stemProfile = response[1].response.players.length != 0;
  let externalProfileUrl = stemProfile ? response[1].response.players[0].profileurl : null;
  let externalProfileCorsUrl = externalProfileUrl ? externalProfileUrl.replace('https://steamcommunity.com/', '/cors/steamcommunity/') : null

  if (scoreStats) {
    ['averageAccuracy', 'averageRankedAccuracy'].forEach(k => {
      if (scoreStats[k] && Number.isFinite(scoreStats[k])) scoreStats[k] *= 100;
    })
  }

  return {playerId, name, playerInfo: {
    avatar: profilePicture,
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
  queue.BEATLEADER_API.player(playerId, priority, queueOptions),
  queue.BEATLEADER_API.steamProfile(playerId, priority, queueOptions)]);

const client = createClient(get, process);

export default client;
