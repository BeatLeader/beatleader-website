import {default as createQueue, PRIORITY} from '../http-queue';
import {substituteVars} from '../../utils/format'

export {PRIORITY};

export const SS_API_HOST = 'https://new.scoresaber.com';
export const SS_API_URL = `${SS_API_HOST}/api`;

export const SS_API_PLAYER_INFO_URL = SS_API_URL + '/player/${playerId}/full';
export const SS_API_RECENT_SCORES_URL = SS_API_URL + '/player/${playerId}/scores/recent/${page}';
export const SS_API_TOP_SCORES_URL = SS_API_URL + '/player/${playerId}/scores/top/${page}';

export default (options = {}) => {
  const queue = createQueue(options);

  const {fetchJson, fetchHtml, ...queueToReturn} = queue;

  const fetchScores = async (baseUrl, playerId, page = 1, signal = null, priority = PRIORITY.FG_LOW) => fetchJson(substituteVars(baseUrl, {playerId, page,}), {signal}, priority);

  const player = async (playerId, signal = null, priority = PRIORITY.FG_LOW) => fetchJson(substituteVars(SS_API_PLAYER_INFO_URL, {playerId}), {signal}, priority).then(r => r.body);
  const recentScores = async (playerId, page = 1, signal = null, priority = PRIORITY.FG_LOW) => fetchScores(SS_API_RECENT_SCORES_URL, playerId, page, signal, priority).then(r => r.body);
  const topScores = async (playerId, page = 1, signal = null, priority = PRIORITY.FG_LOW) => fetchScores(SS_API_TOP_SCORES_URL, playerId, page, signal, priority).then(r => r.body);

  return {
    player,
    recentScores,
    topScores,
    SS_API_HOST,
    ...queueToReturn,
  }
}