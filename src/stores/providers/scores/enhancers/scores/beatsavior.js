import {delay} from '../../../../../utils/promise'

export default async (data, playerId = null) => {
  if (!data || !data.score) return data;

  await delay(Math.random() * 1000)

  data.score.beatSavior = {test: 'BEAT SAVIOR ENHANCER'}

  return data;
}