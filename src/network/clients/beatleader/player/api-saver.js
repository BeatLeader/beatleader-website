import queue from '../../../queues/queues';
import createClient from '../../generic';
import process from './process';

const get = async ({playerId, priority = queue.PRIORITY.FG_HIGH, ...queueOptions} = {}) =>
	queue.BEATLEADER_API.playerBySaver(playerId, priority, queueOptions);

const client = createClient(get, process);

export default client;
