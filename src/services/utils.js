import {DateTime} from 'luxon';

export const getServicePlayerGain = (playerHistory, dateTruncFunc, dateKey, daysAgo = 1, maxDaysAgo = 7) => {
	if (!playerHistory?.length) return null;

	let todayServiceMidnightDate = dateTruncFunc(new Date());

	const compareToDate = DateTime.fromJSDate(todayServiceMidnightDate).minus({days: daysAgo}).toJSDate();
	const maxServiceDate = DateTime.fromJSDate(todayServiceMidnightDate).minus({days: maxDaysAgo}).toJSDate();

	return playerHistory
		.sort((a, b) => b?.[dateKey]?.getTime() - a?.[dateKey]?.getTime())
		.find(h => h?.[dateKey] <= compareToDate && h?.[dateKey] >= maxServiceDate);
};

export const serviceFilterFunc = serviceParams => s => {
	// accept score if there is no non-empty filter
	if (!Object.entries(serviceParams?.filters ?? {})?.filter(([key, val]) => val)?.length) return true;

	let filterVal = true;

	if (serviceParams?.filters?.search?.length) {
		const song = s?.leaderboard?.song ?? null;
		if (song) {
			const name = `${song?.name?.toLowerCase() ?? ''} ${song?.subName?.toLowerCase() ?? ''} ${song?.author?.toLowerCase() ?? ''} ${
				song?.mapper?.toLowerCase() ?? ''
			}`;

			filterVal &= name.indexOf(serviceParams.filters.search.toLowerCase()) >= 0;
		} else {
			filterVal &= false;
		}
	}

	if (serviceParams?.filters.diff?.length) {
		filterVal &= s?.leaderboard?.diffInfo?.diff?.toLowerCase() === serviceParams.filters.diff?.toLowerCase();
	}

	if (serviceParams?.filters?.songType?.length) {
		filterVal &=
			(serviceParams.filters.songType === 'ranked' && s?.pp > 0) || (serviceParams.filters.songType === 'unranked' && (s?.pp ?? 0) === 0);
	}

	return filterVal;
};
