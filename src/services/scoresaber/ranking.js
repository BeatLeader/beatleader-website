import playersRankingApiClient from '../../network/scoresaber/players/api-ranking-global'
import playersRankingPagesApiClient from '../../network/scoresaber/players/api-ranking-global-pages'
import makePendingPromisePool from '../../utils/pending-promises'
import {PRIORITY} from '../../network/http-queue'
import {SS_API_PLAYERS_PER_PAGE} from '../../network/scoresaber/api-queue'

let service = null;
export default () => {
  if (service) return service;

  const resolvePromiseOrWaitForPending = makePendingPromisePool();

  const fetchGlobal = async (page = 1, priority = PRIORITY.FG_LOW, signal = null) => resolvePromiseOrWaitForPending(`apiClient/rankingGlobal/${page}`, () => playersRankingApiClient.getProcessed({page, signal, priority}));

  const fetchGlobalPages = async (priority = PRIORITY.FG_LOW, signal = null) => resolvePromiseOrWaitForPending(`apiClient/rankingGlobalPages`, () => playersRankingPagesApiClient.getProcessed({signal, priority}));

  const fetchGlobalCount = async (priority = PRIORITY.FG_LOW, signal = null) => {
    const pages = await fetchGlobalPages(priority, signal);
    if (!pages || !Number.isFinite(pages)) return 0;

    return pages * SS_API_PLAYERS_PER_PAGE;
  }
  const destroyService = () => {
    service = null;
  }

  service = {
    getGlobal: fetchGlobal,
    getGlobalCount: fetchGlobalCount,
    getGlobalPages: fetchGlobalPages,
    PLAYERS_PER_PAGE: SS_API_PLAYERS_PER_PAGE,
    destroyService,
  }

  return service;
}