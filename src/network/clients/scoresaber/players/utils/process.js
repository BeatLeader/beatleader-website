import {opt} from '../../../../../utils/js'
import queue from '../../../../queues/queues'

export default response => {

  if (!Array.isArray(response)) return null;

  return response.map(player => {
    let {avatar, country, countryRank, histories: history, id: playerId, name, pp, rank} = player;
    let difference = (history && history.length > 7 ? parseInt(history[history.length - 7]) - parseInt(history[history.length - 1]) : null);

    if (avatar) {
      if (!avatar.startsWith('http'))
        avatar = `${queue.SCORESABER_API.SS_API_HOST}${!avatar.startsWith('/') ? '/' : ''}${avatar}`;
    }

    return {
      playerId,
      name,
      playerInfo: {
        avatar,
        countries: [{country, rank: countryRank}],
        pp,
        rank,
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