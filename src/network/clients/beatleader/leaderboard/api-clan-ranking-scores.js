import queue from '../../../queues/queues';
import createClient from '../../generic';

const process = response => {
	if (!response?.metadata || !Array.isArray(response?.data)) return null;

	return response;
};

const get = async ({leaderboardId, clanRankingId, page = 1, priority = queue.PRIORITY.FG_HIGH, ...queueOptions} = {}) =>
	queue.BEATLEADER_API.clanRankingScores(leaderboardId, clanRankingId, page, priority, queueOptions);

const client = createClient(get, process);

export default client;
