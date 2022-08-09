import createClient from '../../generic'
import queues from '../../../queues/queues'

const process = response => response;

const get = async ({ page = 1, priority = queues.PRIORITY.FG_HIGH, ...queueOptions } = {}) => queues.BEATLEADER_PAGE.rankeds(page, priority, queueOptions)

const client = createClient(get, process);

export default client;