import {opt} from '../../../../../utils/js'
import queue from '../../../../queues/queues'

export default response => {

  if (!Array.isArray(response.players)) return null;

  return response.players.map(player => {
    let {profilePicture: avatar, country, countryRank, histories: history, id: playerId, name, pp, rank} = player;
    let difference = (history.length > 7 ? parseInt(history[history.length - 7]) - parseInt(history[history.length - 1]) : null);

    if (avatar) {
      if (!avatar.startsWith('http'))
        avatar = `${queue.SCORESABER_API.SS_API_HOST}${!avatar.startsWith('/') ? '/' : ''}${avatar}`;
    }

    let externalProfileUrl = playerId > 70000000000000000 ? 'https://steamcommunity.com/profiles/' + playerId : null;
    let externalProfileCorsUrl = playerId > 70000000000000000 ? '/cors/steamcommunity/profiles/' + playerId : null;

    return {
      playerId,
      name,
      playerInfo: {
        avatar,
        countries: [{country, rank: countryRank}],
        pp,
        rank,
        externalProfileUrl,
        externalProfileCorsUrl,
        rankHistory: history && history.length
          ? history.split(',').map(r => parseInt(r, 10)).filter(r => !isNaN(r))
          : [],
      },
      others: {
        difference,
      },
    }
  });
};