import {opt} from '../../../../utils/js'
import {
  getFixedLeaderboardMaxScore, getMaxScore,
} from '../../../../utils/scoresaber/song'

export default (score, bmStats, leaderboardId) => {
  let maxScore;

  if (bmStats && bmStats.notes) {
    maxScore = getMaxScore(bmStats.notes)
  } else if(leaderboardId) {
    maxScore = getFixedLeaderboardMaxScore(leaderboardId, score?.maxScore ?? null)
  }
  if (maxScore) {
    score.maxScore = maxScore;
  }

  if (!score.acc && score.maxScore) {
    let unmodifiedScore = opt(score, 'unmodifiedScore', opt(score, 'score'));
    if (!unmodifiedScore) unmodifiedScore = opt(score, 'score', null);

    if (unmodifiedScore) {
      score.maxScore = maxScore;
      score.acc = unmodifiedScore ? unmodifiedScore / maxScore * 100 : null;

      if (score.score) score.percentage = score.score / score.maxScore * 100;
    }
  }

  if (!score.percentage && score.score && score.maxScore) {
    score.percentage = score.score / score.maxScore * 100;
  }
  
  return score;
}