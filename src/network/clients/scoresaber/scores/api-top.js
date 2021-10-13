import queue from '../../../queues/queues'
import createClient from '../../generic'
import process from './utils/process'

const get = async ({playerId, page = 1, priority = queue.PRIORITY.FG_HIGH, ...queueOptions} = {}) => queue.SCORESABER_API.topScores(playerId, page, priority, queueOptions);

const client = createClient(get, process);

export default {
  ...client,
  type: 'scoresaber/top'
};