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

  const playerRecentPlayUpdatedUnsubscribe = eventBus.on('player-recent-play-updated', async ({playerId, recentPlay, recentPlayLastUpdated}) => {
    if (!playerId || !player || player.playerId !== playerId) return;

    player.recentPlay = recentPlay;
    player.recentPlayLastUpdated = recentPlayLastUpdated;
  });

  return {
    async getProcessed({playerId, type = 'recent', page = 1, priority = queue.PRIORITY.FG_HIGH, signal = null, force = false} = {}) {
      if (!player || player.playerId !== playerId)
        player = await playerService.fetchPlayerOrGetFromCache(playerId, MINUTE, priority, signal);

      return scoresService.fetchScoresPageOrGetFromCache(player, type, page, MINUTE, priority, signal, force);
    },

    async getCached({playerId, type = 'recent', page = 1} = {}) {
      return scoresService.getPlayerScoresPage(playerId, type, page);
    },

    setPlayer(newPlayer) {
      player = newPlayer
    },

    destroy() {
      playerProfileChangedUnsubscribe();
      playerRecentPlayUpdatedUnsubscribe();
    }
  }
}
