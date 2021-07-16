import queue from '../../queues'
import {opt} from '../../../utils/js'

const process = response => {
  if (!opt(response, 'players')) return null;

  if (!Array.isArray(response.players)) return null;

  return response.players.map(player => {
    const {avatar, country, difference, history, playerId, playerName: name, pp, rank} = player;

    return {
      playerId,
      name,
      playerInfo : {
        avatar,
        countries: [{country, rank: null}],
        pp,
        rank,
        rankHistory: history && history.length
          ? history.split(',').map(r => parseInt(r, 10)).filter(r => !isNaN(r))
          : []
      },
      others : {
        difference
      }
    }
  });
};

const get = async ({query, priority = queue.PRIORITY.FG_HIGH, signal = null} = {}) => queue.SCORESABER_API.findPlayer(query, signal, priority);

export default {
  get,
  process,
  getProcessed: async ({query, priority = queue.PRIORITY.FG_HIGH, signal = null} = {}) => process(await get({query, priority, signal})),
}