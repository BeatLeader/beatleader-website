import {default as createQueue, PRIORITY} from '../http-queue';
import {substituteVars} from '../../utils/format'
import {extractDiffAndType} from '../../utils/scoresaber/format'

export const SS_HOST = 'https://scoresaber.com';
export const SS_CORS_HOST = '/cors/score-saber';
export const RANKEDS_URL = SS_CORS_HOST + '/api.php?function=get-leaderboards&cat=1&limit=5000&ranked=1&page=${page}';

export default (options = {}) => {
  const queue = createQueue(options);

  const {fetchJson, fetchHtml, ...queueToReturn} = queue;

  const process = data => {
    if (!data || !data.songs || !Array.isArray(data.songs)) return null;

    return data.songs.map(s => {
      const {
        uid: leaderboardId,
        id: hash,
        name,
        songSubName: subName,
        songAuthorName: authorName,
        levelAuthorName,
        stars,
        image: imageUrl,
        diff
      } = s;

      const diffInfo = extractDiffAndType(diff);

      return {leaderboardId, hash, name, subName, authorName, levelAuthorName, imageUrl, stars, diff, diffInfo};
    })
  }

  const rankeds = async (page = 1, signal = null, priority = PRIORITY.BG_NORMAL) => fetchJson(substituteVars(RANKEDS_URL, {page}), {signal}, priority)
    .then(r => r.body)
    .then(data => process(data))

  return {
    rankeds,
    ...queueToReturn,
  }
}