import queue from '../../../queues/queues'
import {opt} from '../../../../utils/js'
import createClient from '../../generic'

const process = response => opt(response, 'pages', null)

const get = async ({priority = queue.PRIORITY.FG_HIGH, ...queueOptions} = {}) => queue.BEATLEADER_API.rankingGlobalPages(priority, queueOptions);

const client = createClient(get, process);

export default client;