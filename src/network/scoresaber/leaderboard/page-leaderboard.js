import queue from '../../queues'
import {opt} from '../../../utils/js'
import {dateFromString} from '../../../utils/date'
import {extractDiffAndType} from '../../../utils/scoresaber/format'

const process = response => {
  console.warn('PROCESS', response); throw 'test error';

  if (!opt(response, 'scores') || !Array.isArray(response.scores) || !opt(response, 'scores.0.scoreId')) return [];

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

    return {
      leaderboard,
      score: {...score, unmodifiedScore, mods, timeSet: dateFromString(score.timeSet), acc, percentage, ppWeighted},
      lastUpdated: null
    };
  });
}

const get = async ({country, page = 1, priority = queue.PRIORITY.FG_HIGH, signal = null} = {}) => queue.SCORESABER_PAGE.countryRanking(country, page, signal, priority);

export default {
  get,
  process,
  getProcessed: async ({country, page = 1, priority = queue.PRIORITY.FG_HIGH, signal = null} = {}) => process(await get({country, page, priority, signal})),
}