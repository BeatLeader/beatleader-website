import playersGlobalRankingApiClient from '../../network/clients/beatleader/players/api-event-ranking-global';
import playersFriendsRankingApiClient from '../../network/clients/beatleader/players/api-event-ranking-friends';
import miniRankingApiClient from '../../network/clients/beatleader/players/api-minirankings';
import makePendingPromisePool from '../../utils/pending-promises';
import {PRIORITY} from '../../network/queues/http-queue';
import {PLAYERS_PER_PAGE} from '../../utils/beatleader/consts';

let service = null;
export default () => {
	if (service) return service;

	const resolvePromiseOrWaitForPending = makePendingPromisePool();

	const fetchGlobal = async (page = 1, eventId = 1, filters, priority = PRIORITY.FG_LOW, signal = null) =>
		resolvePromiseOrWaitForPending(`apiClient/eventranking/global/${eventId}/${page}`, () =>
			playersGlobalRankingApiClient.getProcessed({page, eventId, filters, signal, priority})
		);

	const fetchFriends = async (page = 1, filters, priority = PRIORITY.FG_LOW, signal = null) =>
		resolvePromiseOrWaitForPending(`pageClient/eventranking/friends/${eventId}/${page}`, () =>
			playersFriendsRankingApiClient.getProcessed({page, eventId, filters, signal, priority})
		);

	const fetchMiniRanking = async (rank, country, countryRank, priority = PRIORITY.FG_LOW, signal = null) =>
		resolvePromiseOrWaitForPending(`pageClient/miniranking/${eventId}/${rank}/${country}/${countryRank}`, () =>
			miniRankingApiClient.getProcessed({rank, eventId, country, countryRank, signal, priority})
		);

	const destroyService = () => {
		service = null;
	};

	service = {
		getGlobal: fetchGlobal,
		getFriends: fetchFriends,
		getMiniRanking: fetchMiniRanking,
		PLAYERS_PER_PAGE,
		destroyService,
	};

	return service;
};
