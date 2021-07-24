import queue from '../../queues/queues'
import createClient from '../generic'

const process = response => response;

const get = async ({key, priority = queue.PRIORITY.FG_HIGH, ...queueOptions} = {}) => queue.BEATSAVER.byKey(key, priority, queueOptions);

const client = createClient(get, process);

export default client;