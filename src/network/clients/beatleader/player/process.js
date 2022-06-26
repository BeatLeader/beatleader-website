import {getHeadsetForHMD, platformDescription} from '../../../../utils/beatleader/format'
import {deepClone} from '../../../../utils/js'

export default response => {
	const {
		id: playerId,
		name,
		country,
		countryRank,
		badges,
		avatar,
		role,
		pp,
		rank,
		banned,
		inactive,
		histories: history,
		scoreStats,
		statsHistory,
		externalProfileUrl,
		allTime,
		lastTwoWeekTime,
		clans,
		patreonFeatures,
	} = response;

	let profilePicture = avatar;
	let externalProfileCorsUrl = externalProfileUrl ? externalProfileUrl.replace('https://steamcommunity.com/', '/cors/steamcommunity/') : null

	if (scoreStats) {
		['averageAccuracy', 'averageRankedAccuracy', 'medianAccuracy', 'medianRankedAccuracy', 'topAccuracy'].forEach(k => {
			if (scoreStats[k] && Number.isFinite(scoreStats[k]) && scoreStats[k] < 2) scoreStats[k] *= 100;
		})
	}

	if (scoreStats?.topHMD) {
		scoreStats.topHMD = getHeadsetForHMD(scoreStats.topHMD)?.name ?? ''
	}

	if (scoreStats?.topPlatform) {
		const platformParts = (scoreStats?.topPlatform ?? '').split(',')
		scoreStats.topPlatform = platformDescription?.[platformParts?.[0] ?? ''] ?? ''
	}

	const processedStatsHistory = deepClone(statsHistory)
	if (processedStatsHistory) {
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
			'topHMD': f => f,
			'topPlatform': f => f,
		};

		Object.entries(fields).forEach(([key, process]) => {
			if (processedStatsHistory[key] === undefined) processedStatsHistory[key] = '';

			processedStatsHistory[key] = processedStatsHistory[key].length && processedStatsHistory[key].split ? processedStatsHistory[key].split(',').map(v => process(v)) : [];

			if (scoreStats[key] !== undefined) processedStatsHistory[key].push(scoreStats[key]);

			if (['countryRank', 'pp', 'rank'].includes(key) && response[key] !== undefined) {
				processedStatsHistory[key].push(response[key]);
			}

			if (processedStatsHistory[key].length > maxEntries) maxEntries = processedStatsHistory[key].length;
		});

		Object.entries(fields).forEach(([key, _]) => {
			if (processedStatsHistory[key].length < maxEntries)
				processedStatsHistory[key] = Array(maxEntries - processedStatsHistory[key].length).fill(null).concat(processedStatsHistory[key]);
		});
	}

	['totalPlayCount', 'rankedPlayCount'].forEach(key => {
		if (!processedStatsHistory || !processedStatsHistory[key]) return;

		processedStatsHistory[`${key}Daily`] = processedStatsHistory[key].reduce((cum, item) => {
			const prev = cum.length ? processedStatsHistory[key][cum.length - 1] : 0;

			let value = item ? item - (prev ?? 0) : 0
			if (value && value < 0) value = 0;

			cum.push(value);

			return cum;
		}, [])
	});

	if (processedStatsHistory && processedStatsHistory.totalPlayCountDaily && processedStatsHistory.rankedPlayCountDaily) {
		processedStatsHistory.unrankedPlayCountDaily = processedStatsHistory.totalPlayCountDaily.map((value, idx) => {
			if (value === null) return null;

			let unranked = value - (processedStatsHistory.rankedPlayCountDaily[idx] ?? 0);
			if (unranked < 0) unranked = 0;

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
		statsHistory: processedStatsHistory ? processedStatsHistory : null,
	};
};