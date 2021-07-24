import queue from '../../queues/queues'
import createClient from '../generic'

const process = response => response;

const get = async ({hash, priority = queue.PRIORITY.FG_HIGH, ...queueOptions} = {}) => queue.BEATSAVER.byHash(hash, priority, queueOptions);

const client = createClient(get, process);

export default client;