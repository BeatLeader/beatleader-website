import {SS_HOST} from '../../../network/queues/scoresaber/page-queue'
import tweened from '../../../svelte-utils/tweened';
import {opt} from '../../../utils/js'

const TWEEN_DURATION = 300;

const scoresStatsTweened = {};
function updateScoresStats(playerData) {
  if (!playerData) return null;

  const playerInfo = opt(playerData, 'playerInfo');
  const scoreStats = opt(playerData, 'scoreStats');

  const statsDef = scoreStats
    ? [
      {key: "totalPlayCount", label: 'Total play count', bgColor: 'var(--selected)'},
      {key: "totalScore", label: 'Total score', bgColor: 'var(--selected)'},
      {key: "rankedPlayCount", label: 'Ranked play count', bgColor: 'var(--ppColour)'},
      {key: "totalRankedScore", label: 'Total ranked score', bgColor: 'var(--ppColour)'},
      {key: "averageRankedAccuracy", label: 'Average', title: 'Average ranked accuracy', digits: 2, suffix: '%', bgColor: 'var(--selected)'},
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
      playerInfo['role'] && playerInfo['role'].length
        ? [{
          label: 'Role',
          value: playerInfo['role'],
          fluid: true,
          type: 'text',
          bgColor: 'var(--dimmed)',
        }]
        : [],
    )
    .filter(s => s);
}

function updateSsBadges(playerData) {
  if (!opt(playerData, 'playerInfo.badges.length')) return null;

  return playerData.playerInfo.badges.map(b => ({src: `${SS_HOST}/imports/images/badges/${b.image}`, title: b.description}));
}

const playerInfoTweened = {};
export default playerData => {
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
    scoresStats: updateScoresStats(playerData),
    ssBadges: updateSsBadges(playerData),
  }
}