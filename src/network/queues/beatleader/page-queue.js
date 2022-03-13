import {default as createQueue, PRIORITY} from '../http-queue';
import {substituteVars} from '../../../utils/format'
import {extractDiffAndType, getDiffColor} from '../../../utils/beatleader/format'
import {formatDateRelative} from '../../../utils/date'

export const BL_HOST = 'https://api.beatleader.xyz/';
export const BL_CDN = 'https://cdn.beatleader.xyz';
export const BS_CDN = 'https://eu.cdn.beatsaver.com';
const RANKEDS_URL = BL_HOST + '/maps?ranked=true&page=${page}';
const COUNTRY_RANKING_URL = BL_HOST + '/players?page=${page}&countries=${country}'
const LEADERBOARD_URL = BL_HOST + '/leaderboard/id/${leaderboardId}'

export default (options = {}) => {
  const queue = createQueue(options);

  const {fetchJson, fetchHtml, ...queueToReturn} = queue;

  const processRankeds = (data) => {
    if (!data || !Array.isArray(data)) return null;

    var result = data.map(s => {
      const {
        id,
        hash,
        name,
        subName,
        author: authorName,
        mapper: levelAuthorName,
        image: imageUrl,
      } = s;
      return s.difficulties.map(difficulty => {
        const {
          stars,
          difficultyName: diff,
          modeName: type 
        } = difficulty;
  
        const diffInfo = {diff, type};
  
        return {leaderboardId: id + "" + difficulty.value + "" + difficulty.mode, hash, name, subName, authorName, levelAuthorName, imageUrl, stars, diff, diffInfo};
      });
    }).flat();

    return result;
  }

  const rankeds = async (page = 1, priority = PRIORITY.BG_NORMAL, options = {}) => fetchJson(substituteVars(RANKEDS_URL, {page}), options, priority)
    .then(r => {
      r.body = processRankeds(r.body);

      return r;
    })

  const processCountryRanking = (country, doc) => {

    const data = doc
      .map(a => {

        let country = a.country;
        country = country ? country.toUpperCase() : null;

        let history = a.histories;
        let histories = history && history.length ? history.split(',').map(r => parseInt(r, 10)).filter(r => !isNaN(r)) : [];
        let difference = (histories.length > 7 ? parseInt(histories[histories.length - 7]) - parseInt(histories[histories.length - 1]) : null);
        let playerName = a.name;
        playerName = playerName || playerName === '' ? playerName.trim() : null;

        let pp = a.pp;
        pp = !isNaN(pp) ? pp : null;

        let rank = a.rank;
        rank = !isNaN(rank) ? rank : null
        return {
          playerId: a.id,
          name: playerName,
          playerInfo: {
            avatar: a.avatar,
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

  const processLeaderboardScores = doc => {
    return doc.map(s => {
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

  const processLeaderboard = (leaderboardId, page, doc) => {

    let led = doc.body;
    
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

  const leaderboard = async (leaderboardId, page = 1, priority = PRIORITY.FG_LOW, options = {}) => 
    fetchJson(substituteVars(LEADERBOARD_URL, {leaderboardId, page}), options, priority)
    .then(r => {
      r.body = processLeaderboard(leaderboardId, page, r);

      return r;
    })

  return {
    rankeds,
    countryRanking,
    leaderboard,
    ...queueToReturn,
  }
}