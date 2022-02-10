import {default as createQueue, PRIORITY} from '../http-queue';
import {substituteVars} from '../../../utils/format'
import {extractDiffAndType, getDiffColor} from '../../../utils/scoresaber/format'
import cfDecryptEmail from '../../../utils/cf-email-decrypt'
import {capitalize, getFirstRegexpMatch, opt} from '../../../utils/js'
import {dateFromString} from '../../../utils/date'
import {LEADERBOARD_SCORES_PER_PAGE} from '../../../utils/scoresaber/consts'
import {formatDateRelative} from '../../../utils/date'

export const SS_HOST = 'https://scoresaber.com';
export const SS_CDN_HOST = 'https://cdn.scoresaber.com';
const SS_CORS_HOST = 'https://scoresaber.com';
const RANKEDS_URL = SS_CORS_HOST + '/api.php?function=get-leaderboards&cat=1&limit=5000&ranked=1&page=${page}';
const COUNTRY_RANKING_URL = SS_CORS_HOST + '/api/players?page=${page}&countries=${country}'
const LEADERBOARD_URL = SS_CORS_HOST + '/api/leaderboard/by-id/${leaderboardId}/info'
const LEADERBOARD_SCORES_URL = SS_CORS_HOST + '/api/leaderboard/by-id/${leaderboardId}/scores?page=${page}'

export const parseSsInt = text => {
  const value = getFirstRegexpMatch(/(-?[0-9,]+)\s*$/, text)
  return value ? parseInt(value.replace(/[^\d-]/g, '') , 10) : null;
}
export const parseSsFloat = text => text ? parseFloat(getFirstRegexpMatch(/([0-9,.]+)\s*$/, text.replace(/[^\d.]/g, ''))) : null;

export default (options = {}) => {
  const queue = createQueue(options);

  const {fetchJson, fetchHtml, ...queueToReturn} = queue;

  const processRankeds = (data) => {
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

  const rankeds = async (page = 1, priority = PRIORITY.BG_NORMAL, options = {}) => fetchJson(substituteVars(RANKEDS_URL, {page}), options, priority)
    .then(r => {
      r.body = processRankeds(r.body);

      return r;
    })

  const processCountryRanking = (country, doc) => {

    const data = doc.players
      .map(a => {

        let country = a.country;
        country = country ? country.toUpperCase() : null;

        let history = a.histories;
        let histories = history && history.length ? history.split(',').map(r => parseInt(r, 10)).filter(r => !isNaN(r)) : [];
        let difference = (histories.length > 7 ? parseSsInt(histories[histories.length - 7]) - parseSsInt(histories[histories.length - 1]) : null);
        let playerName = a.name;
        playerName = playerName || playerName === '' ? playerName.trim() : null;

        let pp = a.pp;
        pp = !isNaN(pp) ? pp : null;

        let rank = a.rank;
        rank = !isNaN(rank) ? rank : null

        // return {
        //   avatar,
        //   country,
        //   difference,
        //   history: [],
        //   playerId: id,
        //   playerName,
        //   pp,
        //   rank,
        // }

        return {
          playerId: a.id,
          name: playerName,
          playerInfo: {
            avatar: a.profilePicture,
            countries: [{country, rank: a.countryRank}],
            pp,
            rank,
            rankHistory: histories,
          },
          others: {
            difference,
          },
        }
      })

    return {players: data};
  }

  const countryRanking = async (country, page = 1, priority = PRIORITY.FG_LOW, options = {}) => fetchJson(substituteVars(COUNTRY_RANKING_URL, {country, page}), options, priority)
    .then(r => {
      r.body = processCountryRanking(country, r.body)

      return r;
    })

  const parseSsLeaderboardScores = doc => {
    return doc.scores.map(a => {
      let ret = {player: {playerInfo: {countries: []}}, score: {lastUpdated: new Date()}};

      ret.player.playerInfo.avatar = a.leaderboardPlayerInfo.profilePicture;

      ret.score.rank = a.rank;

      const player = a.leaderboardPlayerInfo;
      if (player) {
        let country = player.country;
        country = country ? country.toUpperCase() : null;
        if (country) {
          ret.player.playerInfo.country = country
          ret.player.playerInfo.countries.push({country, rank: null});
        }

        ret.player.name = player.name;
        ret.player.name = ret.player.name ? ret.player.name.trim().replace('&#039;', "'") : null;
        ret.player.playerId = player.id;
        ret.player.playerId = ret.player.playerId ? ret.player.playerId.trim() : null;
      } else {
        ret.player.playerId = null;
        ret.player.name = null;
        ret.player.playerInfo.country = null;
      }

      ret.score.score = a.modifiedScore;

      ret.score.timeSetString = formatDateRelative(new Date(a.timeSet));
      ret.score.timeSet = a.timeSet;
      if (ret.score.timeSetString) ret.score.timeSetString = ret.score.timeSetString.trim();
      
      ret.score.mods = a.modifiers && a.modifiers.length ? a.modifiers.split(',').filter(m => m && m.trim().length) : null;

      ret.score.pp = a.pp;

      ret.score.hasReplay = a.hasReplay;

      ret.score.percentage = 0.9;

      return ret;
    });
  }

  const processLeaderboard = (leaderboardId, page, doc) => {

    let led = doc[0].body;
    
    const diffs = led.difficulties.map(a => {
      let leaderboardId = a.leaderboardId;
      let diffAndType = extractDiffAndType(a.difficultyRaw);
      let color = getDiffColor(diffAndType);
      return {name: diffAndType.diff.replace('Plus', '+'), type: diffAndType.type, leaderboardId, color};
    });

    const currentDiff = led.difficulty;

    let diff = null;
    let diffInfo = null;
    if (currentDiff) {
      diffInfo = extractDiffAndType(currentDiff.difficultyRaw);
      diff = diffInfo.diff;
    }

    const songName = led.songName;

    const imageUrl = led.coverImage;

    const songInfo = [
      {id: 'hash', value: led.songHash},
      {id: 'scores', value: led.plays},
      {id: 'status', value: led.ranked ? "Ranked" : "Not Ranked"},
      {id: 'totalScores', value: led.plays},
      {id: 'notes', value: 0},
      {id: 'bpm', value: 0},
      {id: 'stars', value: led.stars},
      {id: 'levelAuthorName', value: led.levelAuthorName},
      {id: 'authorName', value: led.songAuthorName},
      {id: 'name', value: songName}]
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
      }, {imageUrl, stats: {}});

    const {stats, ...song} = songInfo;
    const leaderboard = {leaderboardId, song, diffInfo, stats};

    const totalItems = led.plays;
    const pageQty = 10;

    const scores = parseSsLeaderboardScores(doc[1].body);

    // let diffChartText = getFirstRegexpMatch(/'difficulty',\s*([0-9.,\s]+)\s*\]/, doc.body.innerHTML)
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

  const leaderboard = async (leaderboardId, page = 1, priority = PRIORITY.FG_LOW, options = {}) => Promise.all([
    fetchJson(substituteVars(LEADERBOARD_URL, {leaderboardId, page}), options, priority), 
    fetchJson(substituteVars(LEADERBOARD_SCORES_URL, {leaderboardId, page}), options, priority)])
    .then(r => {
      r[0].body = processLeaderboard(leaderboardId, page, r);

      return r[0];
    })

  

  return {
    rankeds,
    countryRanking,
    leaderboard,
    ...queueToReturn,
  }
}