import createPlayerService from '../../../services/beatleader/player';
import createScoresFetcher from './utils/scores-fetch'
import queue from '../../../network/queues/queues'
import {MINUTE} from '../../../utils/date'
import eventBus from '../../../utils/broadcast-channel-pubsub'

let playerService = null;
let scoresFetcher = null;

export default () => {
  let player;

  playerService = createPlayerService();
  scoresFetcher = createScoresFetcher();

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
    async getProcessed({playerId, service = 'beatleader', serviceParams = {sort: 'recent', order: 'desc', page: 1}, priority = queue.PRIORITY.FG_HIGH, signal = null, force = false} = {}) {
      if (!player || player.playerId !== playerId)
        player = await playerService.fetchPlayerOrGetFromCache(playerId, MINUTE, priority, signal);

      return scoresFetcher.fetchLiveScores(player, service, serviceParams, {refreshInterval: MINUTE, priority, signal, force});
    },

    async getCached({playerId, service = 'beatleader', serviceParams = {sort: 'recent', order: 'desc', page: 1}} = {}) {
      return scoresFetcher.fetchCachedScores(playerId, service, serviceParams);
    },

    setPlayer(newPlayer) {
      player = newPlayer
    },

    destroy() {
      playerProfileChangedUnsubscribe();
      playerRecentPlayUpdatedUnsubscribe();
      // TODO: destroy scoresFetcher & playerService
    }
  }
}
