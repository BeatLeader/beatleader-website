import createLeaderboardService from '../../../services/beatleader/leaderboard';
import createClanRankingService from '../../../services/beatleader/clan-ranking';
import queue from '../../../network/queues/queues';

let leaderboardService = null;
let clanRankingService = null;

export default () => {
	if (!leaderboardService) leaderboardService = createLeaderboardService();
	if (!clanRankingService) clanRankingService = createClanRankingService();

	const getProcessed = async ({
		leaderboardId,
		type = 'global',
		page = 1,
		filters = {},
		priority = queue.PRIORITY.FG_HIGH,
		signal = null,
		force = false,
	} = {}) => {
		switch (type) {
			case 'global':
			case 'graph':
				return await leaderboardService.fetchLeaderboardPage(leaderboardId, page, filters, priority, signal, force);
			case 'clanranking':
				return await clanRankingService.fetchClanRankingPage(leaderboardId, page, priority, signal, force);
			case 'followed':
				return await leaderboardService.fetchLeaderboardPage(leaderboardId, page, {friends: true, ...filters}, priority, signal, force);
			case 'voters':
				return await leaderboardService.fetchLeaderboardPage(leaderboardId, page, {voters: true, ...filters}, priority, signal, force);
			case 'prediction':
				return await leaderboardService.fetchLeaderboardPage(leaderboardId, page, {prediction: true, ...filters}, priority, signal, force);
			case 'accsaber':
				return await leaderboardService.fetchAccSaberPage(leaderboardId, page, priority, signal, force);
		}
	};

	return {
		getProcessed,
		getCached: getProcessed,
	};
};
