import createLeaderboardService from '../../../services/scoresaber/leaderboard';
import queue from '../../../network/queues'

let leaderboardService = null;

export default () => {
  if (!leaderboardService) leaderboardService = createLeaderboardService();

  const getProcessed = async ({leaderboardId, type = 'global', page = 1, priority = queue.PRIORITY.FG_HIGH, signal = null, force = false} = {}) => {
    return type === 'global'
      ? await leaderboardService.fetchPage(leaderboardId, page, priority, signal, force)
      : await leaderboardService.getFriendsLeaderboard(leaderboardId, priority, signal, force);
  }

  return {
    getProcessed,
    getCached: getProcessed
  }
}
