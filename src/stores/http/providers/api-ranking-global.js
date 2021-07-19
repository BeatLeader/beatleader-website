import createRankingService from '../../../services/scoresaber/ranking';
import queue from '../../../network/queues'
import {addToDate, HOUR} from '../../../utils/date'

const PAGES_REFRESH_INTERVAL = HOUR;

let rankingService = null;
let pagesLastRefreshed = null;
let total = null;

export default () => {
  rankingService = createRankingService();

  const getProcessed = async ({page = 1, priority = queue.PRIORITY.FG_HIGH, signal = null, force = false} = {}) => {
    if (!total || !pagesLastRefreshed || addToDate(-PAGES_REFRESH_INTERVAL) > pagesLastRefreshed) {
      pagesLastRefreshed = new Date();
      total = await rankingService.getGlobalCount(priority, signal, force);
    }

    const data = await rankingService.getGlobal(page, priority, signal, force);

    return {total, data}
  }

  return {
    getProcessed,
    getCached: getProcessed
  }
}
