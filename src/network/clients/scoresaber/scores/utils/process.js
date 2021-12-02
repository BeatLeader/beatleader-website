import {dateFromString} from '../../../../../utils/date'
import {extractDiffAndType} from '../../../../../utils/scoresaber/format'
import {opt} from '../../../../../utils/js'

export default response => {
  if (!Array.isArray(response)) return [];

  return response.map(s => {
    const {score: scoreInfo, leaderboard: leaderboardInfo} = s;
    const {
      songHash: hash,
      songName: name,
      songSubName: subName,
      songAuthorName: authorName,
      levelAuthorName,
      difficulty,
      maxScore,
      id: leaderboardId
    } = leaderboardInfo;

    const song = {hash, name, subName, authorName, levelAuthorName};
    const diffInfo = extractDiffAndType(difficulty.difficultyRaw);
    const leaderboard = {leaderboardId, song, diffInfo, difficulty: difficulty.difficulty};

    let {baseScore: unmodifiedScore, modifiers: mods, modifiedScore, pp, weight, ...score} = scoreInfo;

    if (mods && typeof mods === 'string') mods = mods.split(',').map(m => m.trim().toUpperCase()).filter(m => m.length);
    else if (!mods) mods = null;

    const acc = unmodifiedScore / maxScore * 100;
    const percentage = modifiedScore / maxScore * 100;

    const ppWeighted = pp * weight;

    return {
      leaderboard,
      score: {...score, pp, score: modifiedScore, unmodifiedScore, mods, timeSet: dateFromString(score.timeSet), acc, percentage, ppWeighted},
      fetchedAt: new Date(),
      lastUpdated: new Date(),
    };
  });
}