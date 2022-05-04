import tweened from '../../../svelte-utils/tweened';

const TWEEN_DURATION = 300;

const scoresStatsTweened = {};
function updateScoresStats(playerData) {
  if (!playerData) return null;

  const scoreStats = playerData?.scoreStats;
  const statsHistory = playerData?.statsHistory;

  const statsDef = scoreStats
    ? [
      {key: "dailyImprovements", label: 'Improved scores', bgColor: 'darkgreen'},
      {key: "totalPlayCount", label: 'Total play count', bgColor: 'var(--selected)'},
      {key: "totalScore", label: 'Total score', bgColor: 'var(--selected)'},
      {key: "rankedPlayCount", label: 'Ranked play count', bgColor: 'var(--ppColour)'},
      {key: "totalRankedScore", label: 'Total ranked score', bgColor: 'var(--ppColour)'},
      {key: "topPp", label: 'Top PP', bgColor: 'var(--ppColour)'},
      {key: "replaysWatched", label: 'Replays watched', bgColor: 'var(--ppColour)'},
      {key: "averageAccuracy", label: 'Average', title: 'Average accuracy', digits: 2, suffix: '%', bgColor: 'var(--selected)'},
      {key: "averageRankedAccuracy", label: 'Average ranked', title: 'Average ranked accuracy', digits: 2, suffix: '%', bgColor: 'var(--selected)'},
      {key: "medianAccuracy", label: 'Median', title: 'Median accuracy', digits: 2, suffix: '%', bgColor: 'var(--ppColour)'},
      {key: "medianRankedAccuracy", label: 'Median ranked', title: 'Median ranked accuracy', digits: 2, suffix: '%', bgColor: 'var(--ppColour)'},
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
        title: s?.title ?? '',
        value: scoresStatsTweened[s.key],
        prevValue: s.suffix === '%' && statsHistory?.[s.key]?.length > 1 ? statsHistory[s.key][statsHistory[s.key].length - 2] : null,
        prevLabel: "Yesterday",
        digits: s?.digits ?? 0,
        suffix: s?.suffix ?? '',
        fluid: true,
        bgColor: s?.bgColor ?? 'var(--dimmed)',
        key: s.key,
        inline: true,
      }
    })
    .filter(s => s);
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

const playerInfoTweened = {};
export default (playerData, playerStats) => {
  if (!playerData && !playerStats) return {};

  const playerInfo = {...(playerData?.playerInfo ?? null)};

  ['pp', 'rank'].forEach(key => {
    const value = playerInfo && playerInfo[key] ? playerInfo[key] : 0;
    if (!playerInfoTweened.hasOwnProperty(key)) playerInfoTweened[key] = tweened(value, TWEEN_DURATION);
    else playerInfoTweened[key].set(value);

    if (playerInfo) {
      playerInfo[key + 'Value'] = playerInfo[key];
      playerInfo[key] = playerInfoTweened[key];
    }
  });

  const firstCountryRank = playerInfo?.countries?.[0]?.rank;
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
    prevInfo: playerData?.prevInfo ?? null,
    scoresStats: updateScoresStats(playerData),
    accBadges: updateAccBadges(playerStats),
  }
}