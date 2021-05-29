import {delay} from '../../../../../utils/promise'

export default async (data, playerId = null) => {
  if (!data || !data.score) return data;

  await delay(Math.random() * 2000);

  if (!data.score.acc) data.score.acc = Math.random() * 50 + 50;
  if (!data.score.percentage) data.score.percentage = Math.random() * 50 + 50;

  return data;
}