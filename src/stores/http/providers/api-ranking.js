import createRankingService from '../../../services/scoresaber/ranking';
import queue from '../../../network/queues'
import {addToDate, HOUR} from '../../../utils/date'

const PAGES_REFRESH_INTERVAL = HOUR;

let rankingService = null;
let globalPagesLastRefreshed = null;
let total = null;

export default () => {
  if (!rankingService) rankingService = createRankingService();

  const getProcessed = async ({type = 'global', page = 1, priority = queue.PRIORITY.FG_HIGH, signal = null, force = false} = {}) => {
    if (type === 'global' && (!total || !globalPagesLastRefreshed || addToDate(-PAGES_REFRESH_INTERVAL) > globalPagesLastRefreshed)) {
      globalPagesLastRefreshed = new Date();
      total = await rankingService.getGlobalCount(priority, signal, force);
    } else if (type !== 'global') {
      total = null;
    }

    const data = type === 'global'
      ? await rankingService.getGlobal(page, priority, signal, force)
      : await rankingService.getCountry(type, page, priority, signal, force);

    return {total, data}
  }

  return {
    getProcessed,
    getCached: getProcessed
  }
}
