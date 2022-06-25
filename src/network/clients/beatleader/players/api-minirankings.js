import queue from '../../../queues/queues'
import createClient from '../../generic'

const get = async ({rank, country, countryRank, priority = queue.PRIORITY.FG_HIGH, ...queueOptions} = {}) => queue.BEATLEADER_API.minirankings(rank, country, countryRank, priority, queueOptions);

const client = createClient(get, e => e);

export default client;