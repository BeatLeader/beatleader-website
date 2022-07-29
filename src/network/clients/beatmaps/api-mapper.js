import queue from '../../queues/queues'
import createClient from '../generic'

const get = async ({id, priority = queue.PRIORITY.FG_HIGH, ...queueOptions} = {}) => queue.BEATMAPS.mapperById(id, priority, queueOptions);

const client = createClient(get, response => response);

export default client;