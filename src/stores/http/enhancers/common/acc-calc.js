import {opt} from '../../../../utils/js'
import {
  getFixedLeaderboardMaxScore,
  getMaxScoreFromSongCharacteristics,
} from '../../../../utils/scoresaber/song'

export default (score, characteristics, diffInfo, leaderboardId) => {
  if (!score.acc) {
    let maxScore;

    if (characteristics && diffInfo) {
      maxScore = getMaxScoreFromSongCharacteristics(characteristics, diffInfo);
    } else if(leaderboardId) {
      maxScore = getFixedLeaderboardMaxScore(leaderboardId)
    }

    if (maxScore) {
      let unmodifiedScore = opt(score, 'unmodifiedScore', opt(score, 'score'));
      if (!unmodifiedScore) unmodifiedScore = opt(score, 'score', null);

      if (unmodifiedScore) {
        score.maxScore = maxScore;
        score.acc = unmodifiedScore ? unmodifiedScore / maxScore * 100 : null;

        if (score.score) score.percentage = score.score / score.maxScore * 100;
      }
    }

  }

  if (!score.percentage && score.score && score.maxScore) {
    score.percentage = score.score / score.maxScore * 100;
  }
  
  return score;
}