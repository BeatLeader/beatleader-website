import playersGlobalRankingApiClient from '../../network/scoresaber/players/api-ranking-global'
import playersGlobalRankingPagesApiClient from '../../network/scoresaber/players/api-ranking-global-pages'
import playersCountryRankingPageClient from '../../network/scoresaber/players/page-ranking-country'
import makePendingPromisePool from '../../utils/pending-promises'
import {PRIORITY} from '../../network/http-queue'
import {PLAYERS_PER_PAGE} from '../../utils/scoresaber/consts'

let service = null;
export default () => {
  if (service) return service;

  const resolvePromiseOrWaitForPending = makePendingPromisePool();

  const fetchGlobal = async (page = 1, priority = PRIORITY.FG_LOW, signal = null) => resolvePromiseOrWaitForPending(`apiClient/ranking/global/${page}`, () => playersGlobalRankingApiClient.getProcessed({page, signal, priority}));

  const fetchCountry = async (country, page = 1, priority = PRIORITY.FG_LOW, signal = null) => resolvePromiseOrWaitForPending(`pageClient/ranking/${country}/${page}`, () => playersCountryRankingPageClient.getProcessed({country, page, signal, priority}));

  const fetchGlobalPages = async (priority = PRIORITY.FG_LOW, signal = null) => resolvePromiseOrWaitForPending(`apiClient/rankingGlobalPages`, () => playersGlobalRankingPagesApiClient.getProcessed({signal, priority}));

  const fetchGlobalCount = async (priority = PRIORITY.FG_LOW, signal = null) => {
    const pages = await fetchGlobalPages(priority, signal);
    if (!pages || !Number.isFinite(pages)) return 0;

    return pages * PLAYERS_PER_PAGE;
  }

  const destroyService = () => {
    service = null;
  }

  service = {
    getGlobal: fetchGlobal,
    getGlobalCount: fetchGlobalCount,
    getGlobalPages: fetchGlobalPages,
    getCountry: fetchCountry,
    PLAYERS_PER_PAGE,
    destroyService,
  }

  return service;
}