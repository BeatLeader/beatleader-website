import queue from '../../../queues/queues'
import process from './utils/process';
import createClient from '../../generic'

const get = async ({playerId, page = 1, priority = queue.PRIORITY.FG_HIGH, ...queueOptions} = {}) => queue.SCORESABER_API.recentScores(playerId, page, priority, queueOptions);

const client = createClient(get, process);

export default {
  ...client,
  type: 'recent'
};