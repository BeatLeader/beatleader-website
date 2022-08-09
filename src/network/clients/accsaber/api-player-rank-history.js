import queue from '../../queues/queues'
import createClient from '../generic'
import { fromAccSaberDateString } from '../../../utils/date'
import { isDateObject } from '../../../utils/js'

const process = response => {
  const playerId = response?.fetchOptions?.playerId ?? null;
  if (!response?.response || !Object.keys(response.response)?.length || !playerId) return [];


  return {
    playerId,
    history: Object.entries(response.response)
      .map(([date, rank]) => ({ date: fromAccSaberDateString(date), rank }))
      .filter(obj => isDateObject(obj?.date))
      .sort((a, b) => a.date.getTime() - b.date.getTime())
    ,
  }
}

const get = async ({ playerId, page = 1, priority = queue.PRIORITY.FG_HIGH, ...queueOptions } = {}) => {
  const response = await queue.ACCSABER.playerRankHistory(playerId, priority, queueOptions);

  return { ...response, body: { response: response.body, fetchOptions: { playerId } } }
}

const client = createClient(get, process);

export default client;