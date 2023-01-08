import createLeaderboardService from '../../../services/beatleader/leaderboard';
import queue from '../../../network/queues/queues';

let leaderboardService = null;

export default () => {
	if (!leaderboardService) leaderboardService = createLeaderboardService();

	const getProcessed = async ({
		leaderboardId,
		type = 'global',
		leaderboardType = 0,
		page = 1,
		filters = {},
		priority = queue.PRIORITY.FG_HIGH,
		signal = null,
		force = false,
	} = {}) => {
		console.log(leaderboardType);
		switch (type) {
			case 'global':
				return await leaderboardService.fetchLeaderboardPage(leaderboardId, leaderboardType, page, filters, priority, signal, force);
			case 'friends':
				return await leaderboardService.fetchLeaderboardPage(
					leaderboardId,
					leaderboardType,
					page,
					{friends: true},
					priority,
					signal,
					force
				);
			case 'voters':
				return await leaderboardService.fetchLeaderboardPage(leaderboardId, leaderboardType, page, {voters: true}, priority, signal, force);
			case 'accsaber':
				return await leaderboardService.fetchAccSaberPage(leaderboardId, leaderboardType, page, priority, signal, force);
		}
	};

	return {
		getProcessed,
		getCached: getProcessed,
	};
};
