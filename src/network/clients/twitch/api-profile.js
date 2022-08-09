import queue from '../../queues/queues'
import createClient from '../generic'
import { opt } from '../../../utils/js'

const process = response => {
  if (!opt(response, 'data.0')) return null;

  return { ...response.data[0], profileLastUpdated: new Date() };
};

const get = async ({ accessToken, login, priority = queue.PRIORITY.FG_HIGH, ...queueOptions } = {}) => queue.TWITCH.profile(accessToken, login, priority, queueOptions);

const client = createClient(get, process);

export default {
  ...client
}
