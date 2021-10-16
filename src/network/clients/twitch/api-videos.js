import queue from '../../queues/queues'
import createClient from '../generic'

const process = response => {
  if (!response || !response.data || !Array.isArray(response.data)) return null;

  return response.data;
};

const get = async ({accessToken, userId, type = 'archive', priority = queue.PRIORITY.FG_HIGH, ...queueOptions} = {}) => queue.TWITCH.videos(accessToken, userId, type, queueOptions);

const client = createClient(get, process);

export default {
  ...client,
}
