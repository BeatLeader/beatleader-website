import queue from '../../queues/queues'
import createClient from '../generic'
import process from './utils/process'

const get = async ({key, priority = queue.PRIORITY.FG_HIGH, ...queueOptions} = {}) => queue.BEATMAPS.byKey(key, priority, queueOptions);

const client = createClient(get, process);

export default client;