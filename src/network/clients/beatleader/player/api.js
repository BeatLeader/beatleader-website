import queue from '../../../queues/queues';
import createClient from '../../generic';
import process from './process';

const get = async ({playerId, priority = queue.PRIORITY.FG_HIGH, keepOriginalId = true, ...queueOptions} = {}) =>
	queue.BEATLEADER_API.player(playerId, priority, keepOriginalId, queueOptions);

const client = createClient(get, process);

export default client;
