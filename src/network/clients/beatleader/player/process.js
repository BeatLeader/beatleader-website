import {getHeadsetForHMD, platformDescription} from '../../../../utils/beatleader/format';
import {processScore} from '../scores/utils/processScore';

export default response => {
	const {
		id: playerId,
		name,
		alias,
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
		richBioTimeset,
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
		profileSettings,
		changes,
		clanOrder,
	} = response;

	let profilePicture = avatar;

	if (scoreStats) {
		[
			'averageAccuracy',
			'averageRankedAccuracy',
			'averageWeightedRankedAccuracy',
			'medianAccuracy',
			'medianRankedAccuracy',
			'topAccuracy',
			'topPercentile',
			'countryTopPercentile',
		].forEach(k => {
			if (scoreStats[k] && Number.isFinite(scoreStats[k]) && scoreStats[k] < 2) scoreStats[k] *= 100;
		});
	}

	if (scoreStats?.topHMD) {
		scoreStats.rawTopHMD = scoreStats.topHMD;
		scoreStats.topHMD = getHeadsetForHMD(scoreStats.topHMD)?.name ?? '';
	}

	if (scoreStats?.topPlatform) {
		const platformParts = (scoreStats?.topPlatform ?? '').split(',');
		scoreStats.topPlatform = platformDescription?.[platformParts?.[0] ?? ''] ?? '';
	}

	let sponsor = role?.includes('sponsor');

	let profileAppearance = profileSettings?.profileAppearance ? profileSettings.profileAppearance.split(',') : [];
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
		alias,
		role,
		playerInfo: {
			avatar: profilePicture,
			externalProfileUrl,
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
			richBioTimeset,
			badges,
			role,
			sponsor,
			patreonFeatures,
			mapperId,
			socials,
			changes,
			clans,
			clanOrder,
		},
		profileSettings: profileSettings
			? {
					...profileSettings,
					profileAppearance,
					starredFriends: profileSettings?.starredFriends?.split(',') ?? null,
			  }
			: {
					profileAppearance,
			  },
		scoreStats: scoreStats ? scoreStats : null,
	};
};
