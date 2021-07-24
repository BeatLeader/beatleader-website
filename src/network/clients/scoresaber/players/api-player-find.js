import queue from '../../../queues/queues'
import process from './utils/process'
import createClient from '../../generic'

const get = async ({query, priority = queue.PRIORITY.FG_HIGH, ...queueOptions} = {}) => queue.SCORESABER_API.findPlayer(query, priority, queueOptions);

const client = createClient(get, process);

export default client;