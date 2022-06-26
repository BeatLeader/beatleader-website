import playersGlobalRankingApiClient from '../../network/clients/beatleader/players/api-ranking-global'
import playersCountryRankingApiClient from '../../network/clients/beatleader/players/api-ranking-country'
import playersFriendsRankingApiClient from '../../network/clients/beatleader/players/api-ranking-friends'
import miniRankingApiClient from '../../network/clients/beatleader/players/api-minirankings'
import makePendingPromisePool from '../../utils/pending-promises'
import {PRIORITY} from '../../network/queues/http-queue'
import {PLAYERS_PER_PAGE} from '../../utils/beatleader/consts'
import {opt} from '../../utils/js'

let service = null;
export default () => {
  if (service) return service;

  const resolvePromiseOrWaitForPending = makePendingPromisePool();

  const fetchGlobal = async (page = 1, filters, priority = PRIORITY.FG_LOW, signal = null) => resolvePromiseOrWaitForPending(`apiClient/ranking/global/${page}`, () => playersGlobalRankingApiClient.getProcessed({page, filters, signal, priority}));

  const fetchCountry = async (country, page = 1, filters, priority = PRIORITY.FG_LOW, signal = null) => resolvePromiseOrWaitForPending(`pageClient/ranking/${country}/${page}`, () => playersCountryRankingApiClient.getProcessed({country, page, filters, signal, priority}));

  const fetchFriends = async (page = 1, filters, priority = PRIORITY.FG_LOW, signal = null) => resolvePromiseOrWaitForPending(`pageClient/ranking/friends/${page}`, () => playersFriendsRankingApiClient.getProcessed({page, filters, signal, priority}));

  const fetchMiniRanking = async (rank, country, countryRank, priority = PRIORITY.FG_LOW, signal = null) => resolvePromiseOrWaitForPending(`pageClient/miniranking/${rank}/${country}/${countryRank}`, () => miniRankingApiClient.getProcessed({rank, country, countryRank, signal, priority}));

  const destroyService = () => {
    service = null;
  }

  service = {
    getGlobal: fetchGlobal,
    getCountry: fetchCountry,
    getFriends: fetchFriends,
    getMiniRanking: fetchMiniRanking,
    PLAYERS_PER_PAGE,
    destroyService,
  }

  return service;
}