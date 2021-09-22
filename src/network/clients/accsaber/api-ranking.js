import queue from '../../queues/queues'
import createClient from '../generic'

const process = response => {
  const category = response?.fetchOptions?.category ?? 'overall';
  if (!response?.response || !Array.isArray(response.response)) return [];

  return response.response.map(p => ({
    ...p,
    id: `${p.playerId}-${category}`,
    category,
    lastUpdated: new Date(),
  }));
}

const get = async ({category = 'overall', priority = queue.PRIORITY.FG_HIGH, ...queueOptions} = {}) => {
  const response = await queue.ACCSABER.ranking(category, priority, queueOptions);

  return {...response, body: {response: response.body, fetchOptions: {category}}}
}

const client = createClient(get, process);

export default client;