import {opt} from '../../../../utils/js'
import {getMaxScoreFromSongCharacteristics} from '../../../../utils/scoresaber/song'

export default (score, characteristics, diffInfo) => {
  if (!score.acc) {
    const maxScore = getMaxScoreFromSongCharacteristics(characteristics, diffInfo);
    if (maxScore) {
      let unmodifiedScore = opt(score, 'unmodifiedScore', opt(score, 'score'));
      if (!unmodifiedScore) unmodifiedScore = opt(score, 'score', null);

      if (unmodifiedScore) {
        score.maxScore = maxScore;
        score.acc = unmodifiedScore ? unmodifiedScore / maxScore * 100 : null;
      }
    }

  }
  if (!score.percentage && score.score && score.maxScore) {
    score.percentage = score.score / score.maxScore * 100;
  }
  
  return score;
}