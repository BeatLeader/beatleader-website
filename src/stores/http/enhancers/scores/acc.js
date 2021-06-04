import {getMaxScoreFromSongCharacteristics} from '../../../../utils/scoresaber/song'
import {opt} from '../../../../utils/js'

export default async (data, playerId = null) => {
  if (!data || !data.score || !opt(data, 'leaderboard.diffInfo')) return data;

  const characteristics = opt(data, 'leaderboard.beatSaver.metadata.characteristics');
  if (!characteristics) return data;

  if (!data.score.acc) {
    const maxScore = await getMaxScoreFromSongCharacteristics(characteristics, data.leaderboard.diffInfo);
    if (maxScore) {
      const unmodifiedScore = opt(data.score, 'unmodifiedScore', opt(data.score, 'score'));

      data.score.maxScore = maxScore;
      data.score.acc = unmodifiedScore ? unmodifiedScore / maxScore * 100 : null;
    }

  }
  if (!data.score.percentage && data.score.score && data.score.maxScore) {
    data.score.percentage = data.score.score / data.score.maxScore * 100;
  }

  return data;
}