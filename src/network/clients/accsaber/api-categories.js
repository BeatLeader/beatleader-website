import queue from '../../queues/queues';
import createClient from '../generic';

const process = response => {
	if (!response || !Array.isArray(response)) return [];

	return response.map(c => ({
		name: c.categoryName,
		displayName: c.categoryDisplayName,
		countsTowardsOverall: c.countsTowardsOverall,
		description: c.description,
	}));
};

const get = async ({priority = queue.PRIORITY.FG_HIGH, ...queueOptions} = {}) => queue.ACCSABER.categories(priority, queueOptions);

const client = createClient(get, process);

export default client;
