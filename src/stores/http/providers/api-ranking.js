import createRankingService from '../../../services/beatleader/ranking';
import queue from '../../../network/queues/queues'

let rankingService = null;

export default () => {
  if (!rankingService) rankingService = createRankingService();

  const getProcessed = async ({ type = 'global', page = 1, filters = {}, priority = queue.PRIORITY.FG_HIGH, signal = null, force = false } = {}) => {
    page = parseInt(page, 10);
    if (isNaN(page)) page = 1;

    let data = null;
    switch (type) {
      case 'friends':
        data = await rankingService.getFriends(page, filters, priority, signal, force);
        break;

      default:
        data = await rankingService.getGlobal(page, filters, priority, signal, force);
    }

    return { total: data?.metadata?.total ?? null, data: data?.data ?? [] }
  }

  return {
    getProcessed,
    getCached: async () => null
  }
}
