import {opt} from '../../../../utils/js'
import calculateAcc from '../common/acc-calc'

export default async (data) => {
  if (!data || !data.score) return;

  const diffInfo = opt(data, 'leaderboard.diffInfo');
  const characteristics = opt(data, 'leaderboard.beatSaver.metadata.characteristics');

  if (!diffInfo || !characteristics) return;

  data.score = calculateAcc(data.score, characteristics, diffInfo);
}