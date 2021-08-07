import queue from '../../../queues/queues'
import createClient from '../../generic'
import {opt} from '../../../../utils/js'

const process = response => {
  console.warn('twitch videos response', response);
  
  return response;
};

const get = async ({accessToken, userId, type = 'archive', priority = queue.PRIORITY.FG_HIGH, ...queueOptions} = {}) => queue.TWITCH.videos(accessToken, accessToken, userId, type, queueOptions);

const client = createClient(get, process);

export default {
  ...client,
  type: 'top',
}
