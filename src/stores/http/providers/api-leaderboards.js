import createLeaderboardService from '../../../services/beatleader/leaderboard';
import queue from '../../../network/queues/queues'

let leaderboardService = null;

export default () => {
  if (!leaderboardService) leaderboardService = createLeaderboardService();

  const getProcessed = async ({ page = 1, filters = {}, priority = queue.PRIORITY.FG_HIGH, signal = null, force = false } = {}) => leaderboardService.fetchAllLeaderboardsPage(page, filters, priority, signal, force);

  return {
    getProcessed,
    getCached: getProcessed
  }
}
