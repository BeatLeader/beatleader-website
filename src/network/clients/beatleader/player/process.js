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
		bot,
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

	let profileAppearance = profileSettings?.profileAppearance ? profileSettings.profileAppearance.split(',') : null;
	if (profileAppearance) {
		const hasAnyScoreSortingOrFilteringSettings = profileAppearance.some(a => a.startsWith('ss-') || a.startsWith('sf-'));
		if (!hasAnyScoreSortingOrFilteringSettings) {
			// set default score sorting and filtering appearance if none are set
			profileAppearance = [
				...profileAppearance,
				'ss-already-set',
				'ss-pp',
				'ss-date',
				'ss-acc',
				'ss-rank',
				'ss-stars',
				'ss-pauses',
				'ss-maxStreak',
				'ss-mistakes',
				'sf-search',
				'sf-diff',
				'sf-mode',
				'sf-requirements',
				'sf-songType',
				'sf-stars',
				'sf-modifiers',
				'sf-eventId',
			];
		}
	}

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
			bot,
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
			? {
					...profileSettings,
					profileAppearance,
					starredFriends: profileSettings?.starredFriends?.split(',') ?? null,
			  }
			: null,
		scoreStats: scoreStats ? scoreStats : null,
		eventsParticipating: processedEventsParticipating,
	};
};
