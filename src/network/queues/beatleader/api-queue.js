import {default as createQueue, PRIORITY} from '../http-queue';
import {substituteVars} from '../../../utils/format'
import {PLAYER_SCORES_PER_PAGE, PLAYERS_PER_PAGE} from '../../../utils/beatleader/consts'

export const BL_API_URL = `https://beatleader.azurewebsites.net/`;
export const STEAM_API_URL = '/cors/steamapi'
export const STEAM_KEY = 'B0A7AF33E804D0ABBDE43BA9DD5DAB48';

export const BL_API_PLAYER_INFO_URL = BL_API_URL + '/player/${playerId}';
export const BL_API_SCORES_URL = BL_API_URL + '/player/${playerId}/scores?page=${page}&sortBy=${sort}&order=${order}&search=${search}&diff=${diff}&type=${songType}';
export const BL_API_FIND_PLAYER_URL = BL_API_URL + '/players?search=${query}'
export const BL_API_RANKING_GLOBAL_URL = BL_API_URL + '/players?page=${page}'
export const BL_API_RANKING_GLOBAL_PAGES_URL = BL_API_URL + '/players/count'

export const STEAM_API_PROFILE_URL = STEAM_API_URL + '/ISteamUser/GetPlayerSummaries/v0002/?key=${steamKey}&steamids=${playerId}'
export const STEAM_API_GAME_INFO_URL = STEAM_API_URL + '/IPlayerService/GetRecentlyPlayedGames/v0001/?key=${steamKey}&steamid=${playerId}'

export default (options = {}) => {
  const queue = createQueue(options);

  const {fetchJson, fetchHtml, ...queueToReturn} = queue;

  const fetchScores = async (baseUrl, playerId, page = 1, priority = PRIORITY.FG_LOW, options = {}) => fetchJson(substituteVars(baseUrl, {playerId, page}, true), options, priority);

  const player = async (playerId, priority = PRIORITY.FG_LOW, options = {}) => fetchJson(substituteVars(BL_API_PLAYER_INFO_URL, {playerId}), options, priority)

  const steamProfile = async (playerId, priority = PRIORITY.FG_LOW, options = {}) => fetchJson(substituteVars(STEAM_API_PROFILE_URL, {steamKey: STEAM_KEY, playerId}), options, priority)
  const gameInfo = async (playerId, priority = PRIORITY.FG_LOW, options = {}) => fetchJson(substituteVars(STEAM_API_GAME_INFO_URL, {steamKey: STEAM_KEY , playerId}), options, priority)

  const scores = async (playerId, page = 1, params = {sort: 'date', order: 'desc', filter: {}}, priority = PRIORITY.FG_LOW, options = {}) => fetchScores(substituteVars(BL_API_SCORES_URL, {...params, ...(params?.filters ?? {})}), playerId, page, priority, options);

  const findPlayer = async (query, priority = PRIORITY.FG_LOW, options = {}) => fetchJson(substituteVars(BL_API_FIND_PLAYER_URL, {query: encodeURIComponent(query)}), options, priority);

  const rankingGlobal = async (page = 1, priority = PRIORITY.FG_LOW, options = {}) => fetchJson(substituteVars(BL_API_RANKING_GLOBAL_URL, {page}), options, priority);

  const rankingGlobalPages = async (priority = PRIORITY.FG_LOW, options = {}) => fetchJson(BL_API_RANKING_GLOBAL_PAGES_URL, options, priority);

  return {
    player,
    steamProfile,
    gameInfo,
    findPlayer,
    rankingGlobal,
    rankingGlobalPages,
    scores,
    BL_API_URL,
    PLAYER_SCORES_PER_PAGE,
    PLAYERS_PER_PAGE,
    ...queueToReturn,
  }
}