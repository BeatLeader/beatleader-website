import {default as createQueue, PRIORITY} from '../http-queue';
import {substituteVars} from '../../../utils/format'
import {PLAYER_SCORES_PER_PAGE, PLAYERS_PER_PAGE} from '../../../utils/beatleader/consts'
import {formatDateRelative} from '../../../utils/date'
import {getDiffColor} from '../../../utils/beatleader/format'

export const BL_API_URL = `https://api.beatleader.xyz/`;
export const STEAM_API_URL = '/cors/steamapi'
export const STEAM_KEY = 'B0A7AF33E804D0ABBDE43BA9DD5DAB48';

export const BL_API_PLAYER_INFO_URL = BL_API_URL + '/player/${playerId}';
export const BL_API_SCORES_URL = BL_API_URL + '/player/${playerId}/scores?page=${page}&sortBy=${sort}&order=${order}&search=${search}&diff=${diff}&type=${songType}&stars_from=${starsFrom}&stars_to=${starsTo}';
export const BL_API_FIND_PLAYER_URL = BL_API_URL + '/players?search=${query}'
export const BL_API_RANKING_GLOBAL_URL = BL_API_URL + '/players?page=${page}'
export const BL_API_RANKING_COUNTRY_URL = BL_API_URL + '/players?page=${page}&countries=${country}'
export const BL_API_LEADERBOARD_URL = BL_API_URL + '/leaderboard/id/${leaderboardId}?page=${page}&countries=${country}'
export const BL_API_LEADERBOARDS_URL = BL_API_URL + '/leaderboards?page=${page}&ranked=${ranked}&search=${search}&stars_from=${stars_from}&stars_to=${stars_to}'

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

  const rankingCountry = async (country, page = 1, priority = PRIORITY.FG_LOW, options = {}) => fetchJson(substituteVars(BL_API_RANKING_COUNTRY_URL, {country, page}), options, priority);

  const leaderboards = async (page = 1, filters = {ranked: 'true'}, priority = PRIORITY.FG_LOW, options = {}) => fetchJson(substituteVars(BL_API_LEADERBOARDS_URL, {page, ...filters}, true), options, priority);

  const processLeaderboardScores = response => {
    return response.map(s => {
      let ret = {player: {playerInfo: {countries: []}}, score: {lastUpdated: new Date()}};

      ret.score.rank = s.rank;

      const player = s.player;
      let country = player.country.toUpperCase();
      ret.player.playerInfo.country = country
      ret.player.playerInfo.countries.push({country, rank: player.countryRank});
      ret.player.playerInfo.avatar = player.avatar;

      ret.player.name = player.name;
      ret.player.name = ret.player.name ? ret.player.name.trim().replace('&#039;', "'") : null;
      ret.player.playerId = player.id;
      ret.player.playerId = ret.player.playerId ? ret.player.playerId.trim() : null;

      ret.score.score = s.modifiedScore;

      ret.score.timeSetString = formatDateRelative(new Date(s.timeset));
      ret.score.timeSet = s.timeset;
      if (ret.score.timeSetString) ret.score.timeSetString = ret.score.timeSetString.trim();

      ret.score.mods = s.modifiers && s.modifiers.length ? s.modifiers.split(',').filter(m => m && m.trim().length) : null;

      ret.score.pp = s.pp;
      ret.score.hasReplay = s.replay != null;

      return ret;
    });
  }

  const processLeaderboard = (leaderboardId, page, respons) => {

    let led = respons.body;

    const diffs = led.song.difficulties.map(a => {
      let leaderboardId = led.song.id + "" + a.value + "" + a.mode;
      let diffAndType = {diff: a.difficultyName, type: a.modeName};
      let color = getDiffColor(diffAndType);
      return {name: diffAndType.diff.replace('Plus', '+'), type: diffAndType.type, leaderboardId, color};
    });

    const currentDiff = led.difficulty;

    let diff = null;
    let diffInfo = null;
    if (currentDiff) {
      diffInfo = {diff: currentDiff.difficultyName, type: currentDiff.modeName};
      diff = diffInfo.diff;
    }

    const songInfo = [
      {id: 'hash', value: led.song.hash},
      {id: 'scores', value: led.plays},
      {id: 'status', value: currentDiff.ranked ? "Ranked" : "Not Ranked"},
      {id: 'totalScores', value: led.plays},
      {id: 'notes', value: currentDiff.notes},
      {id: 'bpm', value: currentDiff.bpm},
      {id: 'stars', value: currentDiff.stars},
      {id: 'levelAuthorName', value: led.song.mapper},
      {id: 'authorName', value: led.song.author},
      {id: 'duration', value: led.song.duration},
      {id: 'name', value: led.song.name}]
      .reduce((cum, sid) => {
        let value = sid.value;

        if (value !== null && ['scores', 'totalScores', 'bpm', 'notes', 'stars', 'status'].includes(sid.id)) {

          if (value !== null) {
            cum.stats[sid.id] = value;
          }

          return cum;
        }
        if (value !== null) cum[sid.id] = value;

        return cum;
      }, {imageUrl: led.song.coverImage, stats: {}});

    const {stats, ...song} = songInfo;
    const leaderboard = {leaderboardId, song, diffInfo, stats};

    const totalItems = led.plays;
    const pageQty = 10;

    const scores = processLeaderboardScores(led.scores);

    // let diffChartText = getFirstRegexpMatch(/'difficulty',\s*([0-9.,\s]+)\s*\]/, response.body.innerHTML)
    let diffChart = null;//(diffChartText ? diffChartText : '').split(',').map(i => parseFloat(i)).filter(i => i && !isNaN(i));

    return {
      diffs,
      leaderboard,
      diffChart,
      page,
      pageQty,
      totalItems,
      scores
    }
  }

  const leaderboard = async (leaderboardId, page = 1, filters = {}, priority = PRIORITY.FG_LOW, options = {}) =>
    fetchJson(substituteVars(BL_API_LEADERBOARD_URL, {leaderboardId, page, ...filters}, true), options, priority)
      .then(r => {
        r.body = processLeaderboard(leaderboardId, page, r);

        return r;
      })

  // const leaderboard = async (leaderboardId, page = 1, filters = {}, priority = PRIORITY.FG_LOW, options = {}) => fetchJson(substituteVars(BL_API_LEADERBOARD_URL, {leaderboardId, page, ...filters}, true), options, priority);

  return {
    player,
    steamProfile,
    gameInfo,
    findPlayer,
    rankingGlobal,
    rankingCountry,
    scores,
    leaderboards,
    leaderboard,
    BL_API_URL,
    PLAYER_SCORES_PER_PAGE,
    PLAYERS_PER_PAGE,
    ...queueToReturn,
  }
}