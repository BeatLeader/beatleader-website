import queue from '../../../queues/queues';
import process from './utils/process';
import createClient from '../../generic';

const get = async ({count = 50, page = 1, filters, priority = queue.PRIORITY.FG_HIGH, ...queueOptions} = {}) =>
	queue.BEATLEADER_API.rankingFollowed(count, page, filters, priority, queueOptions);

const client = createClient(get, process);

export default client;
