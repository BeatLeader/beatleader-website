import queue from '../../../queues/queues'
import createClient from '../../generic'
import {opt} from '../../../../utils/js'

const process = response => {
  const {id: playerId, name, country, countryRank, badges, avatar, role, pp, rank, banned, inactive, histories: history, scoreStats, statsHistory, externalProfileUrl, allTime, lastTwoWeekTime, clans, patreonFeatures} = response;
  
  let profilePicture = avatar;
  let externalProfileCorsUrl = externalProfileUrl ? externalProfileUrl.replace('https://steamcommunity.com/', '/cors/steamcommunity/') : null

  if (scoreStats) {
    ['averageAccuracy', 'averageRankedAccuracy', 'medianAccuracy', 'medianRankedAccuracy', 'topAccuracy'].forEach(k => {
      if (scoreStats[k] && Number.isFinite(scoreStats[k]) && scoreStats[k] < 2) scoreStats[k] *= 100;
    })
  }

  if (statsHistory) {
    const processInt = i => {
      let out = parseInt(i, 10);
      return !isNaN(out) ? out : null;
    }
    const processFloat = f => {
      let out = parseFloat(f);
      return !isNaN(out) ? out : null;
    }
    const processFloat100 = f => {
      let out = parseFloat(f);
      return null !== out ? (out < 2 ? out * 100 : out) : null;
    }

    let maxEntries = 0;
    let fields = {
      'averageAccuracy': processFloat100,
      'averageRankedAccuracy': processFloat100,
      'medianAccuracy': processFloat100,
      'medianRankedAccuracy': processFloat100,
      'pp': processFloat,
      'topAccuracy': processFloat100,
      'topPp': processFloat,
      'countryRank': processInt,
      'rank': processInt,
      'rankedPlayCount': processInt,
      'replaysWatched': processInt,
      'totalPlayCount': processInt,
      'totalScore': processInt,
    };

    Object.entries(fields).forEach(([key, process]) => {
      if (statsHistory[key] === undefined) statsHistory[key] = '';

      statsHistory[key] = statsHistory[key].length && statsHistory[key].split ? statsHistory[key].split(',').map(v => process(v)) : [];

      if (scoreStats[key] !== undefined) statsHistory[key].push(scoreStats[key]);

      if (['countryRank', 'pp', 'rank'].includes(key) && response[key] !== undefined) {
        statsHistory[key].push(response[key]);
      }

      if (statsHistory[key].length > maxEntries) maxEntries = statsHistory[key].length;
    });

    Object.entries(fields).forEach(([key, _]) => {
      if (statsHistory[key].length < maxEntries)
        statsHistory[key] = Array(maxEntries - statsHistory[key].length).fill(null).concat(statsHistory[key]);
    });
  }

  ['totalPlayCount', 'rankedPlayCount'].forEach(key => {
    if (!statsHistory || !statsHistory[key]) return;

    statsHistory[`${key}Daily`] = statsHistory[key].reduce((cum, item) => {
      const prev = cum.length ? statsHistory[key][cum.length - 1] : 0;

      let value = item ? item - (prev ?? 0) : 0
      if (value && value < 0) value = 0;

      cum.push(value);

      return cum;
    }, [])
  });

  if (statsHistory && statsHistory.totalPlayCountDaily && statsHistory.rankedPlayCountDaily) {
    statsHistory.unrankedPlayCountDaily = statsHistory.totalPlayCountDaily.map((value, idx) => {
      if (value === null) return null;

      let unranked = value - (statsHistory.rankedPlayCountDaily[idx] ?? 0);
      if(unranked < 0) unranked = 0;

      return unranked;
    });
  }

  let sponsor = role?.includes('sponsor');

  return {
    playerId,
    name,
    playerInfo: {
      avatar: profilePicture,
      externalProfileUrl,
      externalProfileCorsUrl,
      countries: [{country, rank: countryRank}],
      pp,
      banned,
      inactive,
      rank,
      badges,
      allTime,
      lastTwoWeekTime,
      role,
      sponsor,
      patreonFeatures,
      rankHistory: history && history.length
        ? history.split(',').map(r => parseInt(r, 10)).filter(r => !isNaN(r))
        : [],
      clans,
    },
    scoreStats: scoreStats ? scoreStats : null,
    statsHistory: statsHistory ? statsHistory : null,
  };
};

const get = async ({playerId, priority = queue.PRIORITY.FG_HIGH, ...queueOptions} = {}) => queue.BEATLEADER_API.player(playerId, priority, queueOptions);

const client = createClient(get, process);

export default client;
