import {addToDate, DAY, truncateDate} from '../utils/date'

export const getServicePlayerGain = (playerHistory, dateTruncFunc, dateKey, daysAgo = 1, maxDaysAgo = 7) => {
  if (!playerHistory?.length) return null;

  let todayServiceMidnightDate = dateTruncFunc(new Date());

  // fix the compared date if service day is different from the local one
  const serviceVsLocalDiff = truncateDate(todayServiceMidnightDate).getTime() - truncateDate(new Date()).getTime();
  todayServiceMidnightDate = addToDate(-serviceVsLocalDiff, todayServiceMidnightDate);

  const compareAccSaberDate = todayServiceMidnightDate  - DAY * daysAgo;
  const maxServiceDate = todayServiceMidnightDate - DAY * maxDaysAgo;
  return playerHistory
    .sort((a, b) => b?.[dateKey]?.getTime() - a?.[dateKey]?.getTime())
    .find(h => h?.[dateKey] <= compareAccSaberDate && h?.[dateKey] >= maxServiceDate);
}

export const serviceFilterFunc = serviceParams => s => {
  // accept score if there is no non-empty filter
  if (!Object.entries(serviceParams?.filters ?? {})?.filter(([key, val]) => val)?.length) return true;

  let filterVal = true;

  if (serviceParams?.filters?.search?.length) {
    const song = s?.leaderboard?.song ?? null;
    if (song) {
      const name = `${song?.name?.toLowerCase() ?? ''} ${song?.subName?.toLowerCase() ?? ''} ${song?.authorName?.toLowerCase() ?? ''} ${song?.levelAuthorName?.toLowerCase() ?? ''}`

      filterVal &= name.indexOf(serviceParams.filters.search.toLowerCase()) >= 0;
    } else {
      filterVal &= false;
    }
  }

  if (serviceParams?.filters.diff?.length) {
    filterVal &= s?.leaderboard?.diffInfo?.diff?.toLowerCase() === serviceParams.filters.diff?.toLowerCase()
  }

  if (serviceParams?.filters?.songType?.length) {
    filterVal &= (serviceParams.filters.songType === 'ranked' && s?.pp > 0) ||
      (serviceParams.filters.songType === 'unranked' && (s?.pp ?? 0) === 0)
  }

  return filterVal;
}