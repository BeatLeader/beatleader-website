export const API_URL = 'https://new.scoresaber.com/api';

export const PLAYER_INFO_URL = API_URL + '/player/${playerId}/full';
export const RECENT_SCORES_URL = API_URL + '/player/${playerId}/scores/recent/${page}';
export const TOP_SCORES_URL = API_URL + '/player/${playerId}/scores/top/${page}';

const substituteVars = (url, vars) => Object.keys(vars).reduce((cum, key) => cum.replace(new RegExp('\\${' + key + '}', 'gi'), vars[key]), url);

const fetchJson = async (url, options) => fetch(url, options).then(response => response.json());

const fetchScores = async (baseUrl, playerId, page = 1, signal = null) => fetchJson(substituteVars(baseUrl, {playerId, page}), {signal});

export default {
  player: async (playerId, signal = null) => fetchJson(substituteVars(PLAYER_INFO_URL, {playerId}), {signal}),
  recentScores: async (playerId, page = 1, signal = null) => fetchScores(RECENT_SCORES_URL, playerId, page, signal),
  topScores: async (playerId, page = 1, signal = null) => fetchScores(TOP_SCORES_URL, playerId, page, signal),
}
