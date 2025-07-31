import {formatDateRelative, dateFromUnix} from '../../utils/date';

export const RANKING_SORT_BY_PROPS = {
	pp: {prefix: '', suffix: 'pp', zero: '-', digits: 2},
	weightedAcc: {prefix: '', suffix: '%', zero: '-', digits: 2},
	acc: {prefix: '', suffix: '%', zero: '-', digits: 2},
	topPp: {prefix: '', suffix: 'pp', zero: '-', digits: 2},
	maxStreak: {prefix: '', suffix: '', zero: '-', digits: 0},
	playCount: {digits: 0, prefix: '', suffix: ''},
	lastplay: {isText: true},
	steamPlaytime: {digits: 0, prefix: '', suffix: 'h'},
	steamPlaytime2Weeks: {digits: 0, prefix: '', suffix: 'h'},
	scorePlaytime: {digits: 0, prefix: '', suffix: 'h'},
	weightedRank: {digits: 0, prefix: '#', suffix: '', digits: 2},
	rank: {digits: 0, prefix: '#', suffix: ''},
	top1Count: {digits: 0, prefix: '', suffix: ''},
	top1Score: {digits: 0, prefix: '', suffix: ''},
	replaysWatched: {digits: 0, prefix: '', suffix: ''},
	level: {prefix: '', suffix: '', zero: '-', digits: 2},
	prestige: {prefix: '', suffix: '', zero: '-', digits: 2},
	experience: {prefix: '', suffix: '', zero: '-', digits: 2},
	allContextsPp: {prefix: '', suffix: 'pp', zero: '-', digits: 2},
};

export const RANKING_SORT_BY_VALUES = [
	{
		value: 'pp',
		name: 'PP',
		title: 'Sort by PP',
		icon: 'fa-cubes',
	},
	{
		value: 'topPp',
		name: 'Top PP',
		title: 'Sort by top PP',
		icon: 'fa fa-cubes',
	},
	{
		value: 'weightedAcc',
		name: 'Weighted Acc',
		title: 'Sort by weighted accuracy from top 100 plays',
		icon: 'fa fa-crosshairs',
	},
	{
		value: 'maxStreak',
		name: '115 Streak',
		title: 'Sort by longest 115 streak',
		icon: 'icon115s',
	},
	{
		value: 'top1Count',
		name: '#1 Count',
		title: 'Sort by number of top scores',
		icon: 'fa fa-medal',
	},
	{
		value: 'playCount',
		name: 'Play count',
		title: 'Sort by play count',
		icon: 'fas fa-calculator',
	},
	{
		value: 'steamPlaytime',
		name: 'Steam Playtime',
		title: 'Sort by time played recorded by Steam',
		icon: 'fa-brands fa-steam-symbol',
	},
	{
		value: 'steamPlaytime2Weeks',
		name: 'Steam Last 2 Weeks',
		title: 'Sort by time played in the last 2 weeks recorded by Steam',
		icon: 'fa-brands fa-steam-symbol',
	},
	{
		value: 'acc',
		name: 'Acc',
		title: 'Sort by average accuracy',
		icon: 'fa fa-crosshairs',
	},
	{
		value: 'lastplay',
		name: 'Recent',
		title: 'Sort by the most recent score',
		icon: 'fas fa-clock',
	},
	{
		value: 'scorePlaytime',
		name: 'Score Playtime',
		title: 'Sort by the total score playtime',
		icon: 'fas fa-business-time',
	},
	{
		value: 'allContextsPp',
		name: 'All Contexts PP',
		title: 'PP sum from all the leaderboard contexts (No Mods, Golf, SCPM...)',
		icon: 'fa fa-infinity',
	},
	{
		value: 'weightedRank',
		name: 'Weighted Rank',
		title: 'Sort by weighted average leaderboard rank from top 100 plays',
		icon: 'fa fa-chart-line',
	},
	{
		value: 'rank',
		name: 'Rank',
		title: 'Sort by average leaderboard rank',
		icon: 'fa fa-chart-line',
	},

	{
		value: 'top1Score',
		name: 'Podium Score',
		title: 'Sort by score sum from podium scores(#1 - 5, #2 - 3, #3 - 1)',
		icon: 'fa fa-ranking-star',
	},
	{
		value: 'replaysWatched',
		name: 'Watched',
		title: 'Sort by replay watch count',
		icon: 'fa fa-eye',
	},
	{
		value: 'level',
		name: 'Level',
		title: 'Sort by experience level',
		icon: 'fa fa-crosshairs',
	},
	{
		value: 'prestige',
		name: 'Prestige',
		title: 'Sort by prestige',
		icon: 'fa fa-crosshairs',
	},
	{
		value: 'experience',
		name: 'Experience',
		title: 'Sort by experience value',
		icon: 'fa fa-crosshairs',
	},
];

export const RANKING_TYPE_VALUES = [
	{
		name: 'Ranked',
		value: 'ranked',
		icon: 'fa fa-star',
	},
	{
		name: 'Unranked',
		value: 'unranked',
		icon: 'fa fa-shapes',
	},
	{
		name: 'All',
		value: 'all',
		icon: 'fa fa-cubes-stacked',
	},
];

export const RANKING_PP_TYPE_VALUES = [
	{
		name: 'Total',
		value: 'general',
		icon: 'fa fa-up-down-left-right',
	},
	{
		name: 'Accuracy',
		value: 'acc',
		icon: 'fa fa-arrows-to-dot',
	},
	{
		name: 'Pass',
		value: 'pass',
		icon: 'fa fa-person-walking-dashed-line-arrow-right',
	},
	{
		name: 'Tech',
		value: 'tech',
		icon: 'fa fa-arrows-split-up-and-left',
	},
];

export const RANKING_SORT_STAT_KEYS = {
	acc: {
		ranked: 'scoreStats.averageRankedAccuracy',
		unranked: 'scoreStats.averageUnrankedAccuracy',
		all: 'scoreStats.averageAccuracy',
	},
	weightedAcc: 'scoreStats.averageWeightedRankedAccuracy',
	topAcc: {
		ranked: 'scoreStats.topRankedAccuracy',
		unranked: 'scoreStats.topUnrankedAccuracy',
		all: 'scoreStats.topAccuracy',
	},
	playCount: {
		ranked: 'scoreStats.rankedPlayCount',
		unranked: 'scoreStats.unrankedPlayCount',
		all: 'scoreStats.totalPlayCount',
	},
	replaysWatched: 'scoreStats.replaysWatched',
	rank: {
		ranked: 'scoreStats.averageRankedRank',
		unranked: 'scoreStats.averageUnrankedRank',
		all: 'scoreStats.averageRank',
		clan: 'playerInfo.rank',
	},
	weightedRank: {
		ranked: 'scoreStats.averageRankedRank',
		unranked: 'scoreStats.averageUnrankedRank',
		all: 'scoreStats.averageRank',
	},
	lastplay: {
		ranked: 'scoreStats.lastRankedScoreTime',
		unranked: 'scoreStats.lastUnrankedScoreTime',
		all: 'scoreStats.lastScoreTime',
	},
	maxStreak: {
		ranked: 'scoreStats.rankedMaxStreak',
		unranked: 'scoreStats.unrankedMaxStreak',
		all: 'scoreStats.maxStreak',
	},
	pp: {
		general: 'playerInfo.pp',
		acc: 'playerInfo.accPp',
		pass: 'playerInfo.passPp',
		tech: 'playerInfo.techPp',
		clan: 'playerInfo.pp',
	},
	topPp: {
		general: 'scoreStats.topPp',
		acc: 'scoreStats.topAccPP',
		pass: 'scoreStats.topPassPP',
		tech: 'scoreStats.topTechPP',
	},
	top1Count: {
		ranked: 'scoreStats.rankedTop1Count',
		unranked: 'scoreStats.unrankedTop1Count',
		all: 'scoreStats.top1Count',
	},
	top1Score: {
		ranked: 'scoreStats.rankedTop1Score',
		unranked: 'scoreStats.unrankedTop1Score',
		all: 'scoreStats.top1Score',
	},
	level: 'playerInfo.level',
	prestige: 'playerInfo.prestige',
	experience: 'experience',
	steamPlaytime: 'scoreStats.steamPlaytimeForever',
	steamPlaytime2Weeks: 'scoreStats.steamPlaytime2Weeks',
	scorePlaytime: 'scoreStats.scorePlaytime',
	allContextsPp: 'playerInfo.allContextsPp',
};

const opt = (obj, key, defaultValue = undefined) =>
	key.split('.').reduce((o, i) => (o && o[i] !== null && o[i] !== undefined ? o[i] : defaultValue), obj);
const getStat = (data, key) => opt(data, key);
const getAcc = (data, key) => (getStat(data, key) ?? 0) * 100;

export function PlayerValue(player, filters) {
	let valueResult = null;
	const valueFunc = filters.sortBy == 'acc' || filters.sortBy == 'weightedAcc' ? getAcc : getStat;

	const statKey = RANKING_SORT_STAT_KEYS[filters.sortBy];
	if (statKey[filters.ppType]) {
		valueResult = valueFunc(player, statKey[filters.ppType]);
	} else if (statKey[filters.mapsType]) {
		valueResult = valueFunc(player, statKey[filters.mapsType]);
	} else {
		valueResult = valueFunc(player, statKey);
	}

	if (filters.sortBy == 'lastplay') {
		valueResult = valueResult == 0 ? valueResult : formatDateRelative(dateFromUnix(valueResult));
	}

	if (filters.sortBy == 'steamPlaytime' || filters.sortBy == 'steamPlaytime2Weeks' || filters.sortBy == 'scorePlaytime') {
		valueResult = valueResult / 60;
	}

	return valueResult;
}
