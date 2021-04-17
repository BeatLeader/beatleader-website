import {dateFromString} from '../../../../utils/date'
import {extractDiffAndType} from '../../../../scoresaber/format'

export default response => {
  if (!response?.scores || !Array.isArray(response.scores)) return [];

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

    let unmodififiedScore = score?.unmodififiedScore ?? score?.score;

    const acc = unmodififiedScore && score?.maxScore ? unmodififiedScore / score?.maxScore * 100 : null;
    const percentage = score?.score && score?.maxScore ? score?.score / score?.maxScore * 100 : null;

    const ppWeighted = score?.pp && score?.weight ? score.pp * score.weight : null;

    return {leaderboard, score: {...score, timeSet: dateFromString(s.timeSet), acc, percentage, ppWeighted}};
  });
}