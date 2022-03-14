import createRankingService from '../../../services/beatleader/ranking';
import queue from '../../../network/queues/queues'

let rankingService = null;

export default () => {
  if (!rankingService) rankingService = createRankingService();

  const getProcessed = async ({type = 'global', page = 1, priority = queue.PRIORITY.FG_HIGH, signal = null, force = false} = {}) => {
    const data = type === 'global'
      ? await rankingService.getGlobal(page, priority, signal, force)
      : await rankingService.getCountry(type, page, priority, signal, force);

    return {total: data?.metadata?.total ?? null, data: data?.data ?? [] }
  }

  return {
    getProcessed,
    getCached: getProcessed
  }
}
