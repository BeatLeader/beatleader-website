import queue from '../../../queues/queues'
import createClient from '../../generic'
import {opt} from '../../../../utils/js'

const process = response => {
  console.warn('twitch profile response', response);

  return response;
};

const get = async ({accessToken, login, priority = queue.PRIORITY.FG_HIGH, ...queueOptions} = {}) => queue.TWITCH.profile(accessToken, login, priority, queueOptions);

const client = createClient(get, process);

export default {
  ...client,
  type: 'top',
}
