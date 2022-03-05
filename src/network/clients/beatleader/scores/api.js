import queue from '../../../queues/queues'
import process from './utils/process';
import createClient from '../../generic'

const get = async ({playerId, page = 1, params = {sort: 'date', order: 'desc', filters: {}}, priority = queue.PRIORITY.FG_HIGH, ...queueOptions} = {}) => queue.BEATLEADER_API.scores(playerId, page, params, priority, queueOptions);

const client = createClient(get, process);

export default client;