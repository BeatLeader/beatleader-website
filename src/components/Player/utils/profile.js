import {SS_HOST} from '../../../network/queues/scoresaber/page-queue'
import tweened from '../../../svelte-utils/tweened';
import {opt} from '../../../utils/js'

const TWEEN_DURATION = 300;

const scoresStatsTweened = {};
function updateScoresStats(playerData, playerStats) {
  if (!playerData) return null;

  const scoreStats = opt(playerData, 'scoreStats');

  const statsDef = scoreStats
    ? [
      {key: "totalPlayCount", label: 'Total play count', bgColor: 'var(--selected)'},
      {key: "totalScore", label: 'Total score', bgColor: 'var(--selected)'},
      {key: "rankedPlayCount", label: 'Ranked play count', bgColor: 'var(--ppColour)'},
      {key: "totalRankedScore", label: 'Total ranked score', bgColor: 'var(--ppColour)'},
      {key: "averageRankedAccuracy", label: 'Average', title: 'Average ranked accuracy', digits: 2, suffix: '%', bgColor: 'var(--selected)'}
    ]
    : [];

  return statsDef
    .map(s => {
      const value = scoreStats && scoreStats[s.key] ? scoreStats[s.key] : null;
      if (!value && !Number.isFinite(value)) return null;

      if (!scoresStatsTweened.hasOwnProperty(s.key)) scoresStatsTweened[s.key] = tweened(value, TWEEN_DURATION);
      else scoresStatsTweened[s.key].set(value);

      return {
        label: s.label,
        title: opt(s, 'title', ''),
        value: scoresStatsTweened[s.key],
        digits: opt(s, 'digits', 0),
        suffix: opt(s, 'suffix', ''),
        fluid: true,
        bgColor: opt(s, 'bgColor', 'var(--dimmed)'),
      }
    })
    .concat(
      (playerStats && playerStats.topPp && Number.isFinite(playerStats.topPp) ? [{
        label: 'Best PP',
        title: null,
        value: playerStats.topPp,
        digits: 2,
        suffix: 'pp',
        fluid: true,
        bgColor: 'var(--ppColour)',
      }] : [])
    )
    .filter(s => s && (!playerStats || s.label !== 'Average'));
}

function updateAccStats(playerStats) {
  if (!playerStats) return null;

  return (playerStats ? ['topAcc', 'avgAcc', 'medianAcc', 'stdDeviation'] : [])
    .reduce((cum, key) => {
      const value = playerStats[key] ? playerStats[key] : null;
      if (!value && !Number.isFinite(value)) return cum;

      const tweenKey = key === 'avgAcc' ? 'averageRankedAccuracy' : key
      if (!scoresStatsTweened.hasOwnProperty(tweenKey)) scoresStatsTweened[tweenKey] = tweened(value, TWEEN_DURATION);
      else scoresStatsTweened[tweenKey].set(value);

      let metricData = null;

      switch(key) {
        case 'avgAcc':
          metricData = {
            label: 'Average',
            title: 'Average ranked accuracy',
            bgColor: 'var(--selected)'
          };
          break;

        case 'medianAcc':
          metricData = {
            label: 'Median',
            title: 'Median ranked accuracy',
            bgColor: 'var(--ppColour)'
          };
          break;

        case 'stdDeviation':
          metricData = {
            label: 'Std deviation',
            title: 'Standard deviation ranked accuracy',
            bgColor: 'var(--decrease)'
          };
          break;

        case 'topAcc':
          metricData = {
            label: 'Best',
            title: 'Best ranked accuracy',
            bgColor: 'var(--selected)'
          };
          break;
      }

      if (metricData)
        cum.push({
          ...metricData,
          value: scoresStatsTweened[tweenKey],
          digits: 2,
          suffix: '%',
          fluid: true,
        });

      return cum;
    }, [])
}

function updateAccBadges(playerStats) {
  if (!playerStats || !playerStats.badges) return null;

  return playerStats.badges
    .map(badge => {
      const value = badge.value;

      if (!scoresStatsTweened.hasOwnProperty(badge.label)) scoresStatsTweened[badge.label] = tweened(value, TWEEN_DURATION);
      else scoresStatsTweened[badge.label].set(value);

      return {
        ...badge,
        value: scoresStatsTweened[badge.label],
        title: !badge.min ? `< ${badge.max}%` : (!badge.max ? `> ${badge.min}%` : `${badge.min}% - ${badge.max}%`),
        fluid: true,
        digits: 0,
      }
    })
}

function updateSsBadges(playerData) {
  if (!opt(playerData, 'playerInfo.badges.length')) return null;

  return playerData.playerInfo.badges.map(b => ({src: `${SS_HOST}/imports/images/badges/${b.image}`, title: b.description}));
}

const playerInfoTweened = {};
export default (playerData, playerStats) => {
  if (!playerData && !playerStats) return {};

  const playerInfo = {...opt(playerData, 'playerInfo', null)};

  ['pp', 'rank'].forEach(key => {
    const value = playerInfo && playerInfo[key] ? playerInfo[key] : 0;
    if (!playerInfoTweened.hasOwnProperty(key)) playerInfoTweened[key] = tweened(value, TWEEN_DURATION);
    else playerInfoTweened[key].set(value);

    if (playerInfo) {
      playerInfo[key + 'Value'] = playerInfo[key];
      playerInfo[key] = playerInfoTweened[key];
    }
  });

  const firstCountryRank = opt(playerInfo, 'countries.0.rank')
  if (Number.isFinite(firstCountryRank)) {
    playerInfo.countries = playerInfo.countries.map(c => ({...c}))
    const key = 'countryRank'
    const value = playerInfo.countries[0].rank;

    if (!playerInfoTweened.hasOwnProperty(key)) playerInfoTweened[key] = tweened(value, TWEEN_DURATION);
    else playerInfoTweened[key].set(value);

    playerInfo.countries[0].rankValue = value;
    playerInfo.countries[0].rank = playerInfoTweened[key];
  }

  return {
    playerInfo,
    prevInfo: opt(playerData, 'prevInfo', null),
    scoresStats: updateScoresStats(playerData, playerStats),
    accStats: updateAccStats(playerStats),
    accBadges: updateAccBadges(playerStats),
    ssBadges: updateSsBadges(playerData),
  }
}