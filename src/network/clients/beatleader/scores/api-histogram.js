import queue from '../../../queues/queues';
import createClient from '../../generic';

const process = response => response;

const get = async ({
	playerId,
	params = {sort: 'date', order: 'desc', filters: {}},
	priority = queue.PRIORITY.FG_HIGH,
	...queueOptions
} = {}) => queue.BEATLEADER_API.scoresHistogram(playerId, params, priority, queueOptions);

const client = createClient(get, process);

export default client;
