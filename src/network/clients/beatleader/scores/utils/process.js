import {dateFromUnix} from '../../../../../utils/date'
import {extractDiffAndType} from '../../../../../utils/beatleader/format'
import {opt} from '../../../../../utils/js'

export default response => {
  if (!Array.isArray(response)) return [];

  return response.map(s => {
    const {hash, name, subName, author: authorName, mapper: levelAuthorName} = s.leaderboard.song;
    const song = {hash, name, subName, authorName, levelAuthorName};

    const {id: leaderboardId} = s.leaderboard;
    
    const diffInfo = {diff: s.leaderboard.difficulty.difficultyName, type: s.leaderboard.difficulty.modeName};
    const leaderboard = {leaderboardId, song, diffInfo, difficulty: s.leaderboard.difficulty.value};

    let {baseScore: unmodifiedScore, modifiers: mods, modifiedScore, pp, weight, rank, accuracy: acc, ...score} = s;

    acc *= 100;

    if (mods && typeof mods === 'string') mods = mods.split(',').map(m => m.trim().toUpperCase()).filter(m => m.length);
    else if (!mods) mods = null;

    const ppWeighted = pp * weight;

    return {
      leaderboard,
      score: {...score, pp, score: modifiedScore, unmodifiedScore, mods, timeSet: dateFromUnix(score.timeset), acc, percentage: acc, ppWeighted, rank},
      fetchedAt: new Date(),
      lastUpdated: new Date(),
    };
  });
}