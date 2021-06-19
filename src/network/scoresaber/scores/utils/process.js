import {dateFromString} from '../../../../utils/date'
import {extractDiffAndType} from '../../../../utils/scoresaber/format'
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
      ...originalScore
    } = s;

    const song = {hash, name, subName, authorName, levelAuthorName};
    const diffInfo = extractDiffAndType(difficultyRaw);
    const leaderboard = {leaderboardId, song, diffInfo, difficulty};

    let {unmodififiedScore: unmodifiedScore, mods, ...score} = originalScore;

    if (mods && typeof mods === 'string') mods = mods.split(',').map(m => m.trim().toUpperCase()).filter(m => m.length);
    else if (!mods) mods = null;

    const acc = unmodifiedScore && opt(score, 'maxScore') ? unmodifiedScore / score.maxScore * 100 : null;
    const percentage = opt(score, 'originalScore') && opt(score, 'maxScore') ? score.score / score.maxScore * 100 : null;

    const ppWeighted = opt(score, 'pp') && opt(score, 'weight') ? score.pp * score.weight : null;

    return {leaderboard, score: {...score, unmodifiedScore, mods, timeSet: dateFromString(score.timeSet), acc, percentage, ppWeighted}};
  });
}