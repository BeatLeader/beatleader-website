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