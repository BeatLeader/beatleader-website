import playersGlobalRankingApiClient from '../../network/clients/beatleader/players/api-ranking-global';
import playersFollowedRankingApiClient from '../../network/clients/beatleader/players/api-ranking-followed';
import miniRankingApiClient from '../../network/clients/beatleader/players/api-minirankings';
import makePendingPromisePool from '../../utils/pending-promises';
import {PRIORITY} from '../../network/queues/http-queue';
import {PLAYERS_PER_PAGE} from '../../utils/beatleader/consts';

let service = null;
export default () => {
	if (service) return service;

	const resolvePromiseOrWaitForPending = makePendingPromisePool();

	const fetchGlobal = async (count = 50, page = 1, filters, priority = PRIORITY.FG_LOW, signal = null) =>
		resolvePromiseOrWaitForPending(`apiClient/ranking/global/${page}`, () =>
			playersGlobalRankingApiClient.getProcessed({count, page, filters, signal, priority})
		);

	const fetchFollowed = async (count = 50, page = 1, filters, priority = PRIORITY.FG_LOW, signal = null) =>
		resolvePromiseOrWaitForPending(`pageClient/ranking/followed/${page}`, () =>
			playersFollowedRankingApiClient.getProcessed({count, page, filters, signal, priority})
		);

	const fetchMiniRanking = async (rank, country, countryRank, priority = PRIORITY.FG_LOW, signal = null) =>
		resolvePromiseOrWaitForPending(`pageClient/miniranking/${rank}/${country}/${countryRank}`, () =>
			miniRankingApiClient.getProcessed({rank, country, countryRank, signal, priority})
		);

	const destroyService = () => {
		service = null;
	};

	service = {
		getGlobal: fetchGlobal,
		getFollowed: fetchFollowed,
		getMiniRanking: fetchMiniRanking,
		PLAYERS_PER_PAGE,
		destroyService,
	};

	return service;
};
