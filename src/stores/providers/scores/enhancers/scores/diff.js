import {delay} from '../../../../../utils/promise'

export default async (data, playerId = null) => {
  if (!data || !data.score) return data;

  await delay(Math.random() * 1000)

  const randomCoeff = 0.9 + Math.random() * 0.1;
  data.score.prevPercentage = data.score.percentage * randomCoeff;
  data.score.prevAcc = data.score.acc * randomCoeff;
  data.score.prevPp = data.score.pp * randomCoeff;
  data.score.prevScore = data.score.score * randomCoeff;

  return data;
}