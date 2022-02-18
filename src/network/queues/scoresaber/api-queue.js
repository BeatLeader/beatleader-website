import {default as createQueue, PRIORITY} from '../http-queue';
import {substituteVars} from '../../../utils/format'
import {PLAYER_SCORES_PER_PAGE, PLAYERS_PER_PAGE} from '../../../utils/scoresaber/consts'

export const SS_API_URL = `https://beatleader.azurewebsites.net/`;
export const STEAM_API_URL = '/cors/steamapi'
export const STEAM_KEY = 'B0A7AF33E804D0ABBDE43BA9DD5DAB48';

export const SS_API_PLAYER_INFO_URL = SS_API_URL + '/player/${playerId}';
export const SS_API_RECENT_SCORES_URL = SS_API_URL + '/player/${playerId}/scores?page=${page}&sortBy=recent';
export const SS_API_TOP_SCORES_URL = SS_API_URL + '/player/${playerId}/scores?page=${page}&sortBy=topPP';
export const SS_API_FIND_PLAYER_URL = SS_API_URL + '/players?search=${query}'
export const SS_API_RANKING_GLOBAL_URL = SS_API_URL + '/players?page=${page}'
export const SS_API_RANKING_GLOBAL_PAGES_URL = SS_API_URL + '/players/count'

export const STEAM_API_PROFILE_URL = STEAM_API_URL + '/ISteamUser/GetPlayerSummaries/v0002/?key=${steamKey}&steamids=${playerId}'
export const STEAM_API_GAME_INFO_URL = STEAM_API_URL + '/IPlayerService/GetRecentlyPlayedGames/v0001/?key=${steamKey}&steamid=${playerId}'

export default (options = {}) => {
  const queue = createQueue(options);

  const {fetchJson, fetchHtml, ...queueToReturn} = queue;

  const fetchScores = async (baseUrl, playerId, page = 1, priority = PRIORITY.FG_LOW, options = {}) => fetchJson(substituteVars(baseUrl, {playerId, page}), options, priority);

  const player = async (playerId, priority = PRIORITY.FG_LOW, options = {}) => fetchJson(substituteVars(SS_API_PLAYER_INFO_URL, {playerId}), options, priority)

  const steamProfile = async (playerId, priority = PRIORITY.FG_LOW, options = {}) => fetchJson(substituteVars(STEAM_API_PROFILE_URL, {steamKey: STEAM_KEY, playerId}), options, priority)
  const gameInfo = async (playerId, priority = PRIORITY.FG_LOW, options = {}) => fetchJson(substituteVars(STEAM_API_GAME_INFO_URL, {steamKey: STEAM_KEY , playerId}), options, priority)

  const recentScores = async (playerId, page = 1, priority = PRIORITY.FG_LOW, options = {}) => fetchScores(SS_API_RECENT_SCORES_URL, playerId, page, priority, options);

  const topScores = async (playerId, page = 1, priority = PRIORITY.FG_LOW, options = {}) => fetchScores(SS_API_TOP_SCORES_URL, playerId, page, priority, options);

  const findPlayer = async (query, priority = PRIORITY.FG_LOW, options = {}) => fetchJson(substituteVars(SS_API_FIND_PLAYER_URL, {query: encodeURIComponent(query)}), options, priority);

  const rankingGlobal = async (page = 1, priority = PRIORITY.FG_LOW, options = {}) => fetchJson(substituteVars(SS_API_RANKING_GLOBAL_URL, {page}), options, priority);

  const rankingGlobalPages = async (priority = PRIORITY.FG_LOW, options = {}) => fetchJson(SS_API_RANKING_GLOBAL_PAGES_URL, options, priority);

  return {
    player,
    steamProfile,
    gameInfo,
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