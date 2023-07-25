import tweened from '../../../svelte-utils/tweened';
import {diffColors} from '../../../utils/beatleader/format';

const TWEEN_DURATION = 300;

const scoresStatsTweened = {};
function updateScoresStats(playerData) {
	if (!playerData) return null;

	const scoreStats = playerData?.scoreStats;
	const statsHistory = playerData?.statsHistory;

	const statsDef = scoreStats
		? [
				{key: 'totalPlayCount', label: 'Total play count', bgColor: 'var(--selected)'},
				{key: 'totalScore', label: 'Total score', bgColor: 'var(--selected)'},
				{key: 'rankedPlayCount', label: 'Ranked play count', bgColor: 'var(--ppColour)'},
				{key: 'totalRankedScore', label: 'Total ranked score', bgColor: 'var(--ppColour)'},
				{key: 'topPp', label: 'Top PP', bgColor: 'var(--ppColour)', digits: 2, suffix: 'pp'},
				{key: 'replaysWatched', label: 'Replays watched', bgColor: 'var(--ppColour)'},
				{key: 'topAccuracy', label: 'Best acc', title: 'Best accuracy', digits: 2, suffix: '%', bgColor: 'rgba(60,179,113,.75)'},
				{key: 'averageAccuracy', label: 'Average acc', title: 'Average accuracy', digits: 2, suffix: '%', bgColor: 'var(--selected)'},
				{key: 'medianAccuracy', label: 'Median acc', title: 'Median accuracy', digits: 2, suffix: '%', bgColor: 'var(--selected)'},
				{
					key: 'averageRankedAccuracy',
					label: 'Average ranked acc',
					title: 'Average ranked accuracy',
					digits: 2,
					suffix: '%',
					bgColor: 'var(--selected)',
				},
				{
					key: 'averageWeightedRankedAccuracy',
					label: 'Weighted ranked acc',
					title: 'Average ranked accuracy (weighted)',
					digits: 2,
					suffix: '%',
					bgColor: 'var(--ppColour)',
				},
				{
					key: 'medianRankedAccuracy',
					label: 'Median ranked acc',
					title: 'Median ranked accuracy',
					digits: 2,
					suffix: '%',
					bgColor: 'var(--ppColour)',
				},
				{
					key: 'averageWeightedRankedRank',
					label: 'Weighted Average rank',
					title: 'Weighted Average rank',
					digits: 2,
					prefix: '#',
					bgColor: 'var(--selected)',
				},
				{key: 'averageRank', label: 'Average rank', title: 'Average rank', digits: 2, prefix: '#', bgColor: 'var(--selected)'},
				{key: 'topPlatform', label: 'Platform', title: 'Last 50 scores top platform', bgColor: 'var(--selected)'},
				{key: 'topHMD', label: 'Headset', title: 'Last 50 scores top headset', bgColor: 'var(--selected)'},
				{key: 'authorizedReplayWatched', label: 'My replays watched', bgColor: 'var(--selected)', digits: 0, suffix: ''},
				{key: 'watchedReplays', label: 'Replays I watched', bgColor: 'var(--selected)', digits: 0, suffix: ''},
				{
					key: 'rankedTop1Score',
					title: 'Score sum from ranked podium scores(#1 - 5, #2 - 3, #3 - 1)',
					label: 'Podium score',
					bgColor: 'var(--ppColour)',
				},
				{key: 'rankedTop1Count', title: 'Top 1 ranked plays count', label: '#1 count', bgColor: 'var(--ppColour)'},
		  ]
		: [];

	return statsDef
		.map(s => {
			var value = scoreStats && scoreStats[s.key] ? scoreStats[s.key] : null;
			if (!value && !Number.isFinite(value)) return null;

			if (s.key == 'authorizedReplayWatched') {
				value = scoreStats['authorizedReplayWatched'] + scoreStats['anonimusReplayWatched'];
				s.title = `Authorized players watched: ${scoreStats['authorizedReplayWatched']}, anonymous players watched: ${scoreStats['anonimusReplayWatched']}`;
			}

			let resultValue = value;
			let type = 'string';
			if (Number.isFinite(value)) {
				if (!scoresStatsTweened.hasOwnProperty(s.key)) scoresStatsTweened[s.key] = tweened(value, TWEEN_DURATION);
				else scoresStatsTweened[s.key].set(value);

				resultValue = scoresStatsTweened[s.key];
				type = 'number';
			}

			return {
				label: s.label,
				title: s?.title ?? '',
				value: resultValue,
				prevValue: s.suffix === '%' && statsHistory?.[s.key]?.length > 1 ? statsHistory[s.key][statsHistory[s.key].length - 2] : null,
				prevLabel: 'Yesterday',
				digits: s?.digits ?? 0,
				prefix: s?.prefix ?? '',
				suffix: s?.suffix ?? '',
				fluid: true,
				bgColor: s?.bgColor ?? 'var(--dimmed)',
				key: s.key,
				inline: true,
				type,
			};
		})
		.filter(s => s);
}

function updateAccBadges(playerData) {
	if (!playerData?.scoreStats) return null;

	return [
		{label: 'SS+', min: 95, max: null, value: 0, bgColor: diffColors.expertPlus, key: 'sspPlays'},
		{label: 'SS', min: 90, max: 95, value: 0, bgColor: diffColors.expert, key: 'ssPlays'},
		{label: 'S+', min: 85, max: 90, value: 0, bgColor: diffColors.hard, key: 'spPlays'},
		{label: 'S', min: 80, max: 85, value: 0, bgColor: diffColors.normal, key: 'sPlays'},
		{label: 'A', min: null, max: 80, value: 0, bgColor: diffColors.easy, key: 'aPlays'},
	].map(badge => {
		const value = playerData?.scoreStats?.[badge.key] ?? 0;

		if (!scoresStatsTweened.hasOwnProperty(badge.label)) scoresStatsTweened[badge.label] = tweened(value, TWEEN_DURATION);
		else scoresStatsTweened[badge.label].set(value);

		return {
			...badge,
			value: scoresStatsTweened[badge.label],
			title: (!badge.min ? `< ${badge.max}%` : !badge.max ? `> ${badge.min}%` : `${badge.min}% - ${badge.max}%`) + ' (On ranked maps)',
			fluid: true,
			digits: 0,
		};
	});
}

function updateSsBadges(playerData) {
	if (!playerData?.playerInfo.badges?.length) return null;

	return playerData.playerInfo.badges.map(b => ({src: `${b.image}`, title: b.description, link: b.link}));
}

const playerInfoTweened = {};
export default playerData => {
	if (!playerData) return {};

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
		playerInfo.countries = playerInfo.countries.map(c => ({...c}));
		const key = 'countryRank';
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
		accBadges: updateAccBadges(playerData),
		ssBadges: updateSsBadges(playerData),
	};
};
