import {dateFromString} from '../../../../utils/date'
import {extractDiffAndType} from '../../../../scoresaber/format'
import {opt} from '../../../../utils/js'

export default response => {
  if (!opt(response, 'scores') || !Array.isArray(response.scores)) return [];

  return response.scores.map(s => {
    const {
      songHash: hash,
      songName: name,
      songSubName: subName,
      songAuthorName: authorName,
      levelAuthorName,
      difficultyRaw,
      difficulty,
      leaderboardId,
      ...score
    } = s;

    const song = {hash, name, subName, authorName, levelAuthorName};
    const diffInfo = extractDiffAndType(difficultyRaw);
    const leaderboard = {leaderboardId, song, diffInfo, difficulty};

    let unmodififiedScore = opt(score, 'unmodififiedScore', opt(score, 'score'));

    const acc = unmodififiedScore && opt(score, 'maxScore') ? unmodififiedScore / score.maxScore * 100 : null;
    const percentage = opt(score, 'score') && opt(score, 'maxScore') ? score.score / score.maxScore * 100 : null;

    const ppWeighted = opt(score, 'pp') && opt(score, 'weight') ? score.pp * score.weight : null;

    return {leaderboard, score: {...score, timeSet: dateFromString(s.timeSet), acc, percentage, ppWeighted}};
  });
}