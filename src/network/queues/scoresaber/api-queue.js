import {default as createQueue, PRIORITY} from '../http-queue';
import {substituteVars} from '../../../utils/format'
import {PLAYER_SCORES_PER_PAGE, PLAYERS_PER_PAGE} from '../../../utils/scoresaber/consts'

const SS_CORS_HOST = '/cors/score-saber';
export const SS_API_URL = `${SS_CORS_HOST}/api`;

export const SS_API_PLAYER_INFO_URL = SS_API_URL + '/player/${playerId}/full';
export const SS_API_RECENT_SCORES_URL = SS_API_URL + '/player/${playerId}/scores?page=${page}&sort=recent';
export const SS_API_TOP_SCORES_URL = SS_API_URL + '/player/${playerId}/scores?page=${page}&sort=top';
export const SS_API_FIND_PLAYER_URL = SS_API_URL + '/players?search=${query}'
export const SS_API_RANKING_GLOBAL_URL = SS_API_URL + '/players?page=${page}'
export const SS_API_RANKING_GLOBAL_PAGES_URL = SS_API_URL + '/players/count'

export default (options = {}) => {
  const queue = createQueue(options);

  const {fetchJson, fetchHtml, ...queueToReturn} = queue;

  const fetchScores = async (baseUrl, playerId, page = 1, priority = PRIORITY.FG_LOW, options = {}) => fetchJson(substituteVars(baseUrl, {playerId, page}), options, priority);

  const player = async (playerId, priority = PRIORITY.FG_LOW, options = {}) => fetchJson(substituteVars(SS_API_PLAYER_INFO_URL, {playerId}), options, priority);

  const recentScores = async (playerId, page = 1, priority = PRIORITY.FG_LOW, options = {}) => fetchScores(SS_API_RECENT_SCORES_URL, playerId, page, priority, options);

  const topScores = async (playerId, page = 1, priority = PRIORITY.FG_LOW, options = {}) => fetchScores(SS_API_TOP_SCORES_URL, playerId, page, priority, options);

  const findPlayer = async (query, priority = PRIORITY.FG_LOW, options = {}) => fetchJson(substituteVars(SS_API_FIND_PLAYER_URL, {query: encodeURIComponent(query)}), options, priority);

  const rankingGlobal = async (page = 1, priority = PRIORITY.FG_LOW, options = {}) => fetchJson(substituteVars(SS_API_RANKING_GLOBAL_URL, {page}), options, priority);

  const rankingGlobalPages = async (priority = PRIORITY.FG_LOW, options = {}) => fetchJson(SS_API_RANKING_GLOBAL_PAGES_URL, options, priority);

  return {
    player,
    findPlayer,
    rankingGlobal,
    rankingGlobalPages,
    recentScores,
    topScores,
    SS_API_URL,
    PLAYER_SCORES_PER_PAGE,
    PLAYERS_PER_PAGE,
    ...queueToReturn,
  }
}