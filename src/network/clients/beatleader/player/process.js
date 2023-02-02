import {getHeadsetForHMD, platformDescription} from '../../../../utils/beatleader/format';
import {processScore} from '../scores/utils/processScore';

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
		accPp,
		techPp,
		passPp,
		rank,
		lastWeekPp,
		lastWeekRank,
		lastWeekCountryRank,
		banned,
		banDescription,
		inactive,
		mapperId,
		scoreStats,
		externalProfileUrl,
		clans,
		patreonFeatures,
		socials,
		eventsParticipating,
		profileSettings,
		changes,
	} = response;

	let profilePicture = avatar;
	let externalProfileCorsUrl = externalProfileUrl
		? externalProfileUrl.replace('https://steamcommunity.com/', '/cors/steamcommunity/')
		: null;

	if (scoreStats) {
		[
			'averageAccuracy',
			'averageRankedAccuracy',
			'averageWeightedRankedAccuracy',
			'medianAccuracy',
			'medianRankedAccuracy',
			'topAccuracy',
		].forEach(k => {
			if (scoreStats[k] && Number.isFinite(scoreStats[k]) && scoreStats[k] < 2) scoreStats[k] *= 100;
		});
	}

	if (scoreStats?.topHMD) {
		scoreStats.topHMD = getHeadsetForHMD(scoreStats.topHMD)?.name ?? '';
	}

	if (scoreStats?.topPlatform) {
		const platformParts = (scoreStats?.topPlatform ?? '').split(',');
		scoreStats.topPlatform = platformDescription?.[platformParts?.[0] ?? ''] ?? '';
	}

	let sponsor = role?.includes('sponsor');

	let processedEventsParticipating = eventsParticipating?.map(e => ({id: e?.eventId, name: e?.name}));

	return {
		playerId,
		name,
		role,
		playerInfo: {
			avatar: profilePicture,
			externalProfileUrl,
			externalProfileCorsUrl,
			countries: [{country, rank: countryRank}],
			pp,
			accPp,
			techPp,
			passPp,
			banned,
			banDescription,
			inactive,
			rank,
			lastWeekPp,
			lastWeekRank,
			lastWeekCountryRank,
			badges,
			role,
			sponsor,
			patreonFeatures,
			mapperId,
			socials,
			changes,
			clans,
		},
		profileSettings: profileSettings
			? {...profileSettings, profileAppearance: profileSettings?.profileAppearance ? profileSettings.profileAppearance.split(',') : null}
			: null,
		scoreStats: scoreStats ? scoreStats : null,
		eventsParticipating: processedEventsParticipating,
	};
};
