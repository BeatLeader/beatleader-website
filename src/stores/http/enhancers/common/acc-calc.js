import {opt} from '../../../../utils/js'
import {getMaxScoreFromSongCharacteristics} from '../../../../utils/scoresaber/song'

export default (score, characteristics, diffInfo) => {
  if (!score.acc) {
    const maxScore = getMaxScoreFromSongCharacteristics(characteristics, diffInfo);
    if (maxScore) {
      const unmodifiedScore = opt(score, 'unmodifiedScore', opt(score, 'score'));

      score.maxScore = maxScore;
      score.acc = unmodifiedScore ? unmodifiedScore / maxScore * 100 : null;
    }

  }
  if (!score.percentage && score.score && score.maxScore) {
    score.percentage = score.score / score.maxScore * 100;
  }
  
  return score;
}