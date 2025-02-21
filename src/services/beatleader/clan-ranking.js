import clanRankingApiClient from '../../network/clients/beatleader/leaderboard/api-clan-ranking';
import clanRankingScoresApiClient from '../../network/clients/beatleader/leaderboard/api-clan-ranking-scores';
import makePendingPromisePool from '../../utils/pending-promises';
import {PRIORITY} from '../../network/queues/http-queue';
import {MINUTE} from '../../utils/date';

let service = null;
export default () => {
	if (service) return service;

	const resolvePromiseOrWaitForPending = makePendingPromisePool();

	const fetchClanRankingPage = async (leaderboardId, page = 1, priority = PRIORITY.FG_LOW, signal = null, force = false) =>
		resolvePromiseOrWaitForPending(`apiClient/leaderboard/clanRanking/${leaderboardId}/${page}`, () =>
			clanRankingApiClient.getProcessed({leaderboardId, page, signal, priority, cacheTtl: force ? null : MINUTE})
		);

	const fetchClanRankingScores = async (leaderboardId, clanRankingId, page = 1, priority = PRIORITY.FG_LOW, signal = null, force = false) =>
		resolvePromiseOrWaitForPending(`apiClient/leaderboard/clanRankingScores/${leaderboardId}/${clanRankingId}/${page}`, () =>
			clanRankingScoresApiClient.getProcessed({leaderboardId, clanRankingId, page, signal, priority, cacheTtl: force ? null : MINUTE})
		);

	const destroyService = () => {
		service = null;
	};

	service = {
		fetchClanRankingPage,
		fetchClanRankingScores,
		destroyService,
	};

	return service;
};
