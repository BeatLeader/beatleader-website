import queue from '../../../queues/queues';
import createClient from '../../generic';

const process = response => {
	if (!response?.metadata || !Array.isArray(response?.data)) return null;

	return response;
};

const get = async ({page = 1, type = 'ranked', filters = {}, priority = queue.PRIORITY.FG_HIGH, ...queueOptions} = {}) =>
	queue.BEATLEADER_API.maps(page, type, filters, priority, queueOptions);

const client = createClient(get, process);

export default client;
