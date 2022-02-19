import createLeaderboardService from '../../../services/beatleader/leaderboard';
import queue from '../../../network/queues/queues'

let leaderboardService = null;

export default () => {
  if (!leaderboardService) leaderboardService = createLeaderboardService();

  const getProcessed = async ({leaderboardId, type = 'global', page = 1, priority = queue.PRIORITY.FG_HIGH, signal = null, force = false} = {}) => {
    switch(type) {
      case 'global': return await leaderboardService.fetchPage(leaderboardId, page, priority, signal, force);
      case 'accsaber': return await leaderboardService.fetchAccSaberPage(leaderboardId, page, priority, signal, force);
      default: return await leaderboardService.getFriendsLeaderboard(leaderboardId, priority, signal, force);
    }
  }

  return {
    getProcessed,
    getCached: getProcessed
  }
}
