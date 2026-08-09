import queue from '../../../queues/queues';
import process from './process-hydrate';
import createClient from '../../generic';

const get = async ({playerId, priority = queue.PRIORITY.FG_HIGH, ...queueOptions} = {}) =>
	queue.BEATLEADER_API.playerHydrate(playerId, priority, queueOptions);

const client = createClient(get, process);

export default client;
