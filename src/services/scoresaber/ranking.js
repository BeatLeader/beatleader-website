import playersGlobalRankingApiClient from '../../network/clients/scoresaber/players/api-ranking-global'
import playersGlobalRankingPagesApiClient from '../../network/clients/scoresaber/players/api-ranking-global-pages'
import playersCountryRankingPageClient from '../../network/clients/scoresaber/players/page-ranking-country'
import makePendingPromisePool from '../../utils/pending-promises'
import {PRIORITY} from '../../network/queues/http-queue'
import {PLAYERS_PER_PAGE} from '../../utils/scoresaber/consts'
import {opt} from '../../utils/js'

let service = null;
export default () => {
  if (service) return service;

  const resolvePromiseOrWaitForPending = makePendingPromisePool();

  const fetchGlobal = async (page = 1, priority = PRIORITY.FG_LOW, signal = null) => resolvePromiseOrWaitForPending(`apiClient/ranking/global/${page}`, () => playersGlobalRankingApiClient.getProcessed({page, signal, priority}));

  const fetchCountry = async (country, page = 1, priority = PRIORITY.FG_LOW, signal = null) => resolvePromiseOrWaitForPending(`pageClient/ranking/${country}/${page}`, () => playersCountryRankingPageClient.getProcessed({country, page, signal, priority}));

  const fetchGlobalCount = async (priority = PRIORITY.FG_LOW, signal = null) => resolvePromiseOrWaitForPending(`apiClient/rankingGlobalPages`, () => playersGlobalRankingPagesApiClient.getProcessed({signal, priority}));

  const fetchGlobalPages = async (priority = PRIORITY.FG_LOW, signal = null) => {
    const count = await fetchGlobalCount(priority, signal);
    if (!count || !Number.isFinite(pages)) return 0;

    return count / PLAYERS_PER_PAGE;
  }

  async function fetchMiniRanking(rank, country = null, numOfPlayers = 5) {
    try {
      if (!Number.isFinite(numOfPlayers)) numOfPlayers = 5;

      const getPage = rank => Math.floor((rank - 1) / PLAYERS_PER_PAGE) + 1;

      const playerPage = getPage(rank);
      let firstPlayerRank = rank - (numOfPlayers - (numOfPlayers > 2 ? 2 : 1));
      if (firstPlayerRank <= 0) firstPlayerRank = 1;
      const firstPlayerRankPage = getPage(firstPlayerRank);
      const lastPlayerRank = firstPlayerRank + numOfPlayers - 1;
      const lastPlayerRankPage = getPage(lastPlayerRank);

      const pages = [...new Set([playerPage, firstPlayerRankPage, lastPlayerRankPage])].filter(p => p);

      const ranking = (await Promise.all(pages.map(async page => (country ? fetchCountry(country, page) : fetchGlobal(page)))))
        .reduce((cum, arr) => cum.concat(arr), [])
        .filter(player => {
          const rank =  opt(player, 'playerInfo.rank')
          return rank >= firstPlayerRank && rank <= lastPlayerRank;
        })
        .sort((a,b) => opt(a, 'playerInfo.rank') - opt(b, 'playerInfo.rank'))

      return ranking;
    } catch(err) {
      return null;
    }
  }

  const destroyService = () => {
    service = null;
  }

  service = {
    getGlobal: fetchGlobal,
    getGlobalCount: fetchGlobalCount,
    getGlobalPages: fetchGlobalPages,
    getCountry: fetchCountry,
    getMiniRanking: fetchMiniRanking,
    PLAYERS_PER_PAGE,
    destroyService,
  }

  return service;
}