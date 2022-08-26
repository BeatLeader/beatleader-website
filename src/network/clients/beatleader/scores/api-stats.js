import queue from '../../../queues/queues';
import createClient from '../../generic';

const process = response => response;

const get = async ({scoreId, priority = queue.PRIORITY.FG_HIGH, ...queueOptions} = {}) =>
	queue.BEATLEADER_API.scoreStats(scoreId, priority, queueOptions);

const client = createClient(get, process);

export default client;
