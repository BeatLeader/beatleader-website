import {opt} from '../../../../utils/js'
import queue from '../../../queues'

export default response => {
  if (!opt(response, 'players')) return null;

  if (!Array.isArray(response.players)) return null;

  return response.players.map(player => {
    let {avatar, country, difference, history, playerId, playerName: name, pp, rank} = player;

    if (avatar) {
      if (!avatar.startsWith('http'))
        avatar = `${queue.SCORESABER_API.SS_API_HOST}${!avatar.startsWith('/') ? '/' : ''}${avatar}`;
    }

    return {
      playerId,
      name,
      playerInfo: {
        avatar,
        countries: [{country, rank: null}],
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