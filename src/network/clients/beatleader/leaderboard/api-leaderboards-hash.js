import queue from '../../../queues/queues';
import createClient from '../../generic';

const process = response => {
	if (!response?.song || !Array.isArray(response?.leaderboards)) return null;

	return response;
};

const get = async ({hash, priority = queue.PRIORITY.FG_HIGH, ...queueOptions} = {}) =>
	queue.BEATLEADER_API.leaderboardsByHash(hash, priority, queueOptions);

const client = createClient(get, process);

export default client;
