import {default as createQueue, PRIORITY} from '../http-queue';
import {substituteVars} from '../../../utils/format'
import {PLAYER_SCORES_PER_PAGE, PLAYERS_PER_PAGE} from '../../../utils/beatleader/consts'

export const CURRENT_URL = location.protocol + "//" + location.host;
export const BL_API_URL = CURRENT_URL == "https://www.beatleader.xyz" ? `https://api.beatleader.xyz/` : `/cors/blapi/`;
export const STEAM_API_URL = '/cors/steamapi'
export const STEAM_KEY = 'B0A7AF33E804D0ABBDE43BA9DD5DAB48';

export const BL_API_USER_URL = `${BL_API_URL}user`;
export const BL_API_PLAYER_INFO_URL = BL_API_URL + 'player/${playerId}';
export const BL_API_SCORES_URL = BL_API_URL + 'player/${playerId}/scores?page=${page}&sortBy=${sort}&order=${order}&search=${search}&diff=${diff}&type=${songType}&stars_from=${starsFrom}&stars_to=${starsTo}';
export const BL_API_FRIENDS_SCORES_URL = BL_API_URL + 'user/friendScores?page=${page}&sortBy=${sort}&order=${order}&search=${search}&diff=${diff}&type=${songType}&stars_from=${starsFrom}&stars_to=${starsTo}&count=${count}';
export const BL_API_SCORE_STATS_URL = BL_API_URL + 'score/statistic/${scoreId}'
export const BL_API_PLAYER_SCORE_URL = BL_API_URL + 'score/${playerId}/${hash}/${diff}/${type}'
export const BL_API_SCORES_HISTOGRAM_URL = BL_API_URL + 'player/${playerId}/histogram?sortBy=${sort}&order=${order}&search=${search}&diff=${diff}&type=${songType}&stars_from=${starsFrom}&stars_to=${starsTo}&batch=${batch}&count=${count}';
export const BL_API_FIND_PLAYER_URL = BL_API_URL + 'players?search=${query}'
export const BL_API_RANKING_URL = BL_API_URL + 'players?page=${page}&sortBy=${sortBy}&order=${order}&countries=${countries}&friends=${friends}&search=${search}&platform=${platform}&role=${role}&hmd=${hmd}&pp_range=${pp_range}&score_range=${score_range}'
export const BL_API_LEADERBOARD_URL = BL_API_URL + 'leaderboard/${leaderboardId}?page=${page}&countries=${countries}&friends=${friends}'
export const BL_API_LEADERBOARDS_URL = BL_API_URL + 'leaderboards?page=${page}&type=${type}&search=${search}&stars_from=${stars_from}&stars_to=${stars_to}'
export const BL_API_CLANS_URL = BL_API_URL + 'clans?page=${page}&search=${search}&sort=${sort}&order=${order}'
export const BL_API_CLAN_URL = BL_API_URL + 'clan/${clanId}?page=${page}'
export const BL_API_CLAN_CREATE_URL = BL_API_URL + 'clan/create?name=${name}&tag=${tag}&description=${description}&bio=${bio}&color=${color}'
export const BL_API_CLAN_UPDATE_URL = BL_API_URL + 'clan?name=${name}&tag=${tag}&description=${description}&bio=${bio}&color=${color}'
export const BL_API_CLAN_ACCEPT_URL = BL_API_URL + 'clan/accept?id=${id}'
export const BL_API_CLAN_REJECT_URL = BL_API_URL + 'clan/reject?id=${id}&ban=${ban}'
export const BL_API_CLAN_REMOVE_URL = BL_API_URL + 'clan'
export const BL_API_CLAN_LEAVE_URL = BL_API_URL + 'clan/leave?id=${id}'
export const BL_API_CLAN_UNBAN_URL = BL_API_URL + 'clan/unban?id=${id}'
export const BL_API_CLAN_KICK_URL = BL_API_URL + 'clan/kickplayer?player=${player}'
export const BL_API_CLAN_INVITE_URL = BL_API_URL + 'clan/invite?player=${player}'
export const BL_API_CLAN_CANCEL_INVITE_URL = BL_API_URL + 'clan/cancelinvite?player=${player}'
export const BL_API_ACC_GRAPH_URL = BL_API_URL + 'player/${player}/accgraph'
export const BL_API_FRIEND_ADD_URL = BL_API_URL + 'user/friend?playerId=${playerId}'
export const BL_API_FRIEND_REMOVE_URL = BL_API_URL + 'user/friend?playerId=${playerId}'
export const BL_API_MINIRANKINGS_URL = BL_API_URL + 'minirankings?rank=${rank}&country=${country}&countryRank=${countryRank}'

export const STEAM_API_PROFILE_URL = STEAM_API_URL + '/ISteamUser/GetPlayerSummaries/v0002/?key=${steamKey}&steamids=${playerId}'
export const STEAM_API_GAME_INFO_URL = STEAM_API_URL + '/IPlayerService/GetRecentlyPlayedGames/v0001/?key=${steamKey}&steamid=${playerId}'

export default (options = {}) => {
  const queue = createQueue(options);

  const {fetchJson, fetchHtml, ...queueToReturn} = queue;

  const fetchScores = async (baseUrl, playerId, page = 1, priority = PRIORITY.FG_LOW, options = {}) => fetchJson(substituteVars(baseUrl, {playerId, page}, true), {...options, credentials: 'include'}, priority);

  const user = async (priority = PRIORITY.FG_HIGH, options = {}) => fetchJson(BL_API_USER_URL, {...options, retries: 0, credentials: 'include', maxAge: 1, cacheTtl: null}, priority)

  const player = async (playerId, priority = PRIORITY.FG_LOW, options = {}) => fetchJson(substituteVars(BL_API_PLAYER_INFO_URL, {playerId}), options, priority)

  const steamProfile = async (playerId, priority = PRIORITY.FG_LOW, options = {}) => fetchJson(substituteVars(STEAM_API_PROFILE_URL, {steamKey: STEAM_KEY, playerId}), options, priority)
  const gameInfo = async (playerId, priority = PRIORITY.FG_LOW, options = {}) => fetchJson(substituteVars(STEAM_API_GAME_INFO_URL, {steamKey: STEAM_KEY , playerId}), options, priority)

  const scores = async (playerId, page = 1, params = {sort: 'date', order: 'desc', filter: {}}, priority = PRIORITY.FG_LOW, options = {}) => fetchScores(substituteVars(playerId === 'user-friends' ? BL_API_FRIENDS_SCORES_URL : BL_API_SCORES_URL, {...params, ...(params?.filters ?? {})}), playerId, page, priority, options);

  const scoresHistogram = async (playerId, params = {sort: 'date', order: 'desc', filter: {}}, priority = PRIORITY.FG_LOW, options = {}) => fetchScores(substituteVars(BL_API_SCORES_HISTOGRAM_URL, {...params, ...(params?.filters ?? {})}), playerId, priority, options);

  const scoreStats = async (scoreId, priority = PRIORITY.FG_LOW, options = {}) => fetchJson(substituteVars(BL_API_SCORE_STATS_URL, {scoreId: encodeURIComponent(scoreId)}), options, priority);

  const playerScore = async (playerId, hash, diff, type, priority = PRIORITY.FG_LOW, options = {}) => fetchJson(substituteVars(BL_API_PLAYER_SCORE_URL, {playerId, hash, diff, type}), options, priority);

  const findPlayer = async (query, priority = PRIORITY.FG_LOW, options = {}) => fetchJson(substituteVars(BL_API_FIND_PLAYER_URL, {query: encodeURIComponent(query)}), options, priority);

  const rankingGlobal = async (page = 1, filters = {sortBy: "pp"}, priority = PRIORITY.FG_LOW, options = {}) => {
    return fetchJson(substituteVars(BL_API_RANKING_URL, {page, ...filters}, true, true), options, priority);
  }

  const rankingCountry = async (countries, page = 1, filters = {sortBy: "pp"}, priority = PRIORITY.FG_LOW, options = {}) => rankingGlobal(page, {...filters, countries}, priority, options);

  const rankingFriends = async (page = 1, filters = {sortBy: "pp"}, priority = PRIORITY.FG_LOW, options = {}) => rankingGlobal(page, {...filters, friends: "true"}, priority, {...options, credentials: 'include'});

  const minirankings = async (rank, country, countryRank, priority = PRIORITY.FG_LOW, options = {}) => fetchJson(substituteVars(BL_API_MINIRANKINGS_URL, {rank, country, countryRank}), options, priority);

  const leaderboards = async (page = 1, filters = {}, priority = PRIORITY.FG_LOW, options = {}) => {
    if (filters && filters?.type !== 'ranked') {
      delete filters.stars_from;
      delete filters.stars_to;
    }

    return fetchJson(substituteVars(BL_API_LEADERBOARDS_URL, {page, ...filters}, true, true), options, priority);
  }

  const clans = async (page = 1, filters = {}, priority = PRIORITY.FG_LOW, options = {}) => fetchJson(substituteVars(BL_API_CLANS_URL, {page, ...filters}), options, priority);

  const clan = async (clanId, page = 1, filters = {}, priority = PRIORITY.FG_LOW, options = {}) => fetchJson(substituteVars(BL_API_CLAN_URL, {clanId, page, ...filters}), options, priority);

  const clanCreate = async (name, tag, description, bio, color, icon, priority = PRIORITY.FG_HIGH, options = {}) => fetchJson(substituteVars(BL_API_CLAN_CREATE_URL, {name, tag, description, bio, color}, true, true, encodeURIComponent), {body: icon, ...options, retries: 0, method: 'POST', credentials: 'include', maxAge: 1, cacheTtl: null}, priority)

  const clanUpdate = async (name, tag, description, bio, color, icon, priority = PRIORITY.FG_HIGH, options = {}) => fetchHtml(substituteVars(BL_API_CLAN_UPDATE_URL, {name, tag, description, bio, color}, true, true, encodeURIComponent), {body: icon instanceof ArrayBuffer ? icon : null, ...options, retries: 0, method: 'PUT', credentials: 'include', maxAge: 1, cacheTtl: null}, priority)

  const clanAccept = async (clanId, priority = PRIORITY.FG_HIGH, options = {}) => fetchHtml(substituteVars(BL_API_CLAN_ACCEPT_URL, {id: clanId}, true, true, encodeURIComponent), {...options, retries: 0, method: 'POST', credentials: 'include', maxAge: 1, cacheTtl: null}, priority)

  const clanReject = async (clanId, ban = false, priority = PRIORITY.FG_HIGH, options = {}) => fetchHtml(substituteVars(BL_API_CLAN_REJECT_URL, {id: clanId, ban: ban ? 'true' : 'false'}, true, true, encodeURIComponent), {...options, retries: 0, method: 'POST', credentials: 'include', maxAge: 1, cacheTtl: null}, priority)

  const clanRemove = async (priority = PRIORITY.FG_HIGH, options = {}) => fetchHtml(BL_API_CLAN_REMOVE_URL, {...options, retries: 0, method: 'DELETE', credentials: 'include', maxAge: 1, cacheTtl: null}, priority)

  const clanLeave = async (clanId, priority = PRIORITY.FG_HIGH, options = {}) => fetchHtml(substituteVars(BL_API_CLAN_LEAVE_URL, {id: clanId}, true, true, encodeURIComponent), {...options, retries: 0, method: 'POST', credentials: 'include', maxAge: 1, cacheTtl: null}, priority)

  const clanUnban = async (clanId, priority = PRIORITY.FG_HIGH, options = {}) => fetchHtml(substituteVars(BL_API_CLAN_UNBAN_URL, {id: clanId}, true, true, encodeURIComponent), {...options, retries: 0, method: 'POST', credentials: 'include', maxAge: 1, cacheTtl: null}, priority)

  const clanKick = async (playerId, priority = PRIORITY.FG_HIGH, options = {}) => fetchHtml(substituteVars(BL_API_CLAN_KICK_URL, {player: playerId}, true, true, encodeURIComponent), {...options, retries: 0, method: 'POST', credentials: 'include', maxAge: 1, cacheTtl: null}, priority)

  const clanInvite = async (playerId, priority = PRIORITY.FG_HIGH, options = {}) => fetchHtml(substituteVars(BL_API_CLAN_INVITE_URL, {player: playerId}, true, true, encodeURIComponent), {...options, retries: 0, method: 'POST', credentials: 'include', maxAge: 1, cacheTtl: null}, priority)

  const clanCancelInvite = async (playerId, priority = PRIORITY.FG_HIGH, options = {}) => fetchHtml(substituteVars(BL_API_CLAN_CANCEL_INVITE_URL, {player: playerId}, true, true, encodeURIComponent), {...options, retries: 0, method: 'POST', credentials: 'include', maxAge: 1, cacheTtl: null}, priority)

  const accGraph = async (playerId, priority = PRIORITY.FG_LOW, options = {}) => fetchJson(substituteVars(BL_API_ACC_GRAPH_URL, {player: playerId}), options, priority);

  const leaderboard = async (leaderboardId, page = 1, filters = {}, priority = PRIORITY.FG_LOW, options = {}) =>
    fetchJson(substituteVars(BL_API_LEADERBOARD_URL, {leaderboardId, page, ...filters}, true, true), {...options, credentials: 'include'}, priority);

  const addFriend = async (playerId, priority = PRIORITY.FG_HIGH, options = {}) => fetchHtml(substituteVars(BL_API_FRIEND_ADD_URL, {playerId}, true, true, encodeURIComponent), {...options, retries: 0, method: 'POST', credentials: 'include', maxAge: 1, cacheTtl: null}, priority)

  const removeFriend = async (playerId, priority = PRIORITY.FG_HIGH, options = {}) => fetchHtml(substituteVars(BL_API_FRIEND_REMOVE_URL, {playerId}, true, true, encodeURIComponent), {...options, retries: 0, method: 'DELETE', credentials: 'include', maxAge: 1, cacheTtl: null}, priority)

  return {
    user,
    player,
    steamProfile,
    gameInfo,
    findPlayer,
    rankingGlobal,
    rankingCountry,
    rankingFriends,
    scores,
    scoreStats,
    scoresHistogram,
    playerScore,
    leaderboards,
    leaderboard,
    clans,
    clan,
    clanCreate,
    clanUpdate,
    clanAccept,
    clanReject,
    clanRemove,
    clanLeave,
    clanUnban,
    clanKick,
    clanInvite,
    clanCancelInvite,
    accGraph,
    addFriend,
    removeFriend,
    minirankings,
    BL_API_URL,
    PLAYER_SCORES_PER_PAGE,
    PLAYERS_PER_PAGE,
    ...queueToReturn,
  }
}