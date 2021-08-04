import queue from '../../queues/queues'
import createClient from '../generic'
import process from './utils/process'

const get = async ({hash, priority = queue.PRIORITY.FG_HIGH, ...queueOptions} = {}) => queue.BEATMAPS.byHash(hash, priority, queueOptions);

const client = createClient(get, process);

export default client;