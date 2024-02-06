import createClanRankingService from '../../../services/beatleader/clan-ranking';
import queue from '../../../network/queues/queues';

let clanRankingService = null;

export default () => {
	if (!clanRankingService) clanRankingService = createClanRankingService();

	const getProcessed = async ({
		leaderboardId,
		clanRankingId,
		page = 1,
		priority = queue.PRIORITY.FG_HIGH,
		signal = null,
		force = false,
	} = {}) => {
        return await clanRankingService.fetchClanRankingScores(leaderboardId, clanRankingId, page, priority, signal, force);
	};

	return {
		getProcessed,
		getCached: getProcessed,
	};
};
