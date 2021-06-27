import createPlayerService from '../../../services/scoresaber/player';
import createScoresService from '../../../services/scoresaber/scores';
import queue from '../../../network/queues'
import {MINUTE} from '../../../utils/date'
import eventBus from '../../../utils/broadcast-channel-pubsub'

let playerService = null;
let scoresService = null;

export default () => {
  let player;

  playerService = createPlayerService();
  scoresService = createScoresService();

  const playerProfileChangedUnsubscribe = eventBus.on('player-profile-changed', newPlayer => {
    if (!newPlayer || !player || !newPlayer.playerId !== player.playerId) return;

    player = newPlayer;
  });

  return {
    async getProcessed({playerId, type = 'recent', page = 1, priority = queue.PRIORITY.FG_HIGH, signal = null, force = false} = {}) {
      if (!player || player.playerId !== playerId)
        player = await playerService.fetchPlayerOrGetFromCache(playerId, MINUTE, priority, signal);

      return scoresService.fetchScoresPageOrGetFromCache(player, type, page, MINUTE, priority, signal, force);
    },

    setPlayer(newPlayer) {
      player = newPlayer
    },

    destroy() {
      playerProfileChangedUnsubscribe();
    }
  }
}
