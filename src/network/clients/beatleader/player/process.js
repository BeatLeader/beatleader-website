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
		allContextsPp,
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
		linkedIds,
		clans,
		patreonFeatures,
		socials,
		profileSettings,
		changes,
		clanOrder,
		level,
		prestige,
		experience,
	} = response;

	let profilePicture = avatar;

	if (scoreStats && !scoreStats.percentsProcessed) {
		[
			'averageAccuracy',
			'averageRankedAccuracy',
			'averageWeightedRankedAccuracy',
			'medianAccuracy',
			'medianRankedAccuracy',
			'topAccuracy',
			'topRankedAccuracy',
			'topPercentile',
			'countryTopPercentile',
		].forEach(k => {
			if (scoreStats[k] && Number.isFinite(scoreStats[k])) scoreStats[k] *= 100;
		});

		['scorePlaytime', 'steamPlaytime2Weeks', 'steamPlaytimeForever'].forEach(k => {
			if (scoreStats[k] && Number.isFinite(scoreStats[k])) scoreStats[k] /= 60;
		});

		scoreStats.percentsProcessed = true;
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
				'sf-accs',
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
		linkedIds,
		playerInfo: {
			avatar: profilePicture,
			externalProfileUrl,
			country: {country, rank: countryRank},
			pp,
			accPp,
			techPp,
			passPp,
			allContextsPp,
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
			level,
			prestige,
			experience,
			horizontalRichBio: profileSettings?.horizontalRichBio,
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
