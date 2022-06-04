import {dateFromUnix} from '../../../../../utils/date'

export default response => {
  if (!Array.isArray(response?.data)) return {metadata: response?.metadata ?? {}, data: []};

  return {
    metadata: response?.metadata ?? {},
    data: response.data.map(s => {
      const {hash, name, subName, author: authorName, mapper: levelAuthorName, duration, coverImage} = s.leaderboard.song;
      const song = {hash, name, subName, authorName, levelAuthorName, duration, coverImage};

      const {id: leaderboardId} = s.leaderboard;

      const diffInfo = {diff: s.leaderboard.difficulty.difficultyName, type: s.leaderboard.difficulty.modeName};
      const leaderboard = {leaderboardId, song, diffInfo, difficulty: s.leaderboard.difficulty.value, stars: s?.leaderboard?.difficulty?.stars ?? null};

      let {baseScore: unmodifiedScore, modifiers: mods, modifiedScore, pp, weight, rank, accuracy: acc, ...score} = s;

      acc *= 100;

      if (mods && typeof mods === 'string') mods = mods.split(',').map(m => m.trim().toUpperCase()).filter(m => m.length);
      else if (!mods) mods = null;

      const ppWeighted = pp * weight;

      return {
        leaderboard,
        score: {
          ...score,
          pp,
          score: modifiedScore,
          unmodifiedScore,
          mods,
          timeSet: dateFromUnix(score.timeset),
          acc,
          percentage: acc,
          unmodifiedAcc: modifiedScore && unmodifiedScore && acc ? unmodifiedScore / modifiedScore * acc : acc,
          ppWeighted,
          rank
        },
        fetchedAt: new Date(),
        lastUpdated: new Date(),
      };
    })
  };
}