import {dateFromUnix, formatDateRelative, formatDateRelativeShort} from '../../../../../utils/date';
import {getDiffColor} from '../../../../../utils/beatleader/format';

export const processLeaderboardScore = s => {
	if (!s) return null;

	let ret = {player: {playerInfo: {}}, score: {lastUpdated: new Date()}};

	ret.score.rank = s?.rank;

	const player = s.player;
	ret.player.playerInfo.country = {country: player.country.toUpperCase(), rank: player.countryRank};
	ret.player.playerInfo.avatar = player.avatar;
	ret.player.playerInfo.bot = player.bot;
	ret.player.playerInfo.temporary = player.temporary;
	ret.player.playerInfo.pp = player.pp;
	ret.player.playerInfo.rank = player.rank;

	ret.player.name = player.name;
	ret.player.name = ret.player.name ? ret.player.name.trim().replace('&#039;', "'") : null;
	ret.player.playerId = player.id;
	ret.player.alias = player.alias;
	ret.player.playerId = ret.player.playerId ? ret.player.playerId.trim() : null;

	ret.player.clans = player?.clans ?? null;

	ret.player.profileSettings = player?.profileSettings ?? null;

	ret.score.score = s.modifiedScore;

	ret.score.timeSetString = formatDateRelative(dateFromUnix(s.timepost > 0 ? s.timepost : s.timeset));
	ret.score.timeSetStringShort = formatDateRelativeShort(dateFromUnix(s.timepost > 0 ? s.timepost : s.timeset));
	ret.score.timeSet = s.timepost > 0 ? s.timepost : s.timeset;
	if (ret.score.timeSetString) ret.score.timeSetString = ret.score.timeSetString.trim();

	ret.score.mods = s.modifiers && s.modifiers.length ? s.modifiers.split(',').filter(m => m && m.trim().length) : null;

	ret.score.pp = s.pp;
	ret.score.bonusPp = s.bonusPp;
	ret.score.acc = s.accuracy * 100;

	ret.score.id = s?.id ?? null;

	ret.score = {...s, ...ret.score};

	return ret;
};

const processLeaderboardScores = response => response?.map(processLeaderboardScore) ?? null;

export const processClanRanking = cr => {
	if (!cr) return null;

	let ret = {clan: {}};

	const clan = cr?.clan;
	ret.clan.name = clan?.name;
	ret.clan.color = clan?.color;
	ret.clan.icon = clan?.icon;
	ret.clan.tag = clan?.tag;
	ret.clan.playerscount = clan?.playersCount;

	ret.id = cr.id;
	ret.pp = cr.pp;
	ret.lastUpdateTime = formatDateRelative(dateFromUnix(cr.lastUpdateTime > 0 ? cr.lastUpdateTime : cr.lastUpdateTime));
	ret.lastUpdateTimeShort = formatDateRelativeShort(dateFromUnix(cr.lastUpdateTime > 0 ? cr.lastUpdateTime : cr.lastUpdateTime));
	ret.lastUpdateTimeNumber = cr.lastUpdateTime;
	ret.averageRank = cr.averageRank;
	ret.averageAccuracy = cr.averageAccuracy;
	ret.averageAcc = cr.averageAccuracy * 100;
	ret.totalScore = cr.totalScore;
	ret.rank = cr.rank;
	ret.scores = processLeaderboardScores(cr.associatedScores);

	return ret;
};

export const processClanRankings = response => {
	// First process the leaderboard
	const ret = processLeaderboard(response);
	// Second process the clanRankings
	const clanRanking = response.clanRanking?.map(processClanRanking) ?? null;

	const leaderboard = ret.leaderboard;
	const diffs = ret.diffs;
	const diffChart = ret.diffChart;
	const scores = ret.scores;

	const totalItems = response.plays;

	return {
		leaderboard,
		diffs,
		diffChart,
		scores,
		clanRanking,
		totalItems,
	};
};

export const processClanRankingScores = response => {
	// Process the clanRanking
	const clanRanking = processClanRanking(response);
	const clanRankingId = response.id;
	const totalItems = response.associatedScoresCount;

	return {
		clanRankingId,
		clanRanking,
		totalItems,
	};
};

export const processLeaderboard = led => {
	const leaderboardId = led.id;
	const diffs =
		led?.song?.difficulties?.map(a => {
			let leaderboardId = led.song.id + '' + a.value + '' + a.mode;
			let diffAndType = {diff: a.difficultyName, type: a.modeName};
			let color = getDiffColor(diffAndType);
			return {name: diffAndType.diff.replace('Plus', '+'), type: diffAndType.type, leaderboardId, color, stars: a.stars};
		}) ?? null;

	const currentDiff = led.difficulty;

	let diff = null;
	let diffInfo = null;
	if (currentDiff) {
		diffInfo = {diff: currentDiff.difficultyName, type: currentDiff.modeName};
		diff = diffInfo.diff;
	}

	const songInfo = [
		{id: 'hash', value: led?.song?.hash},
		{id: 'id', value: led?.song?.id},
		{id: 'scores', value: led?.plays ?? 0},
		{id: 'status', value: currentDiff?.status},
		{id: 'totalScores', value: led?.plays ?? 0},
		{id: 'notes', value: currentDiff?.notes ?? null},
		{id: 'bpm', value: led?.song?.bpm ?? null},
		{id: 'stars', value: currentDiff?.stars ?? null},
		{id: 'accRating', value: currentDiff?.accRating ?? null},
		{id: 'passRating', value: currentDiff?.passRating ?? null},
		{id: 'techRating', value: currentDiff?.techRating ?? null},
		{id: 'predictedAcc', value: currentDiff?.predictedAcc ?? null},
		{id: 'requirements', value: currentDiff?.requirements ?? null},
		{id: 'type', value: currentDiff?.type},
		{id: 'mapper', value: led?.song?.mapper},
		{id: 'externalStatuses', value: led?.song?.externalStatuses},
		{id: 'featuredPlaylists', value: led?.featuredPlaylists},
		{id: 'author', value: led?.song?.author},
		{id: 'duration', value: led?.song?.duration},
		{id: 'mapperId', value: led?.song?.mapperId},
		{id: 'name', value: led?.song?.name ?? ''},
		{id: 'subName', value: led?.song?.subName},
	].reduce(
		(cum, sid) => {
			let value = sid.value;

			if (value !== null) {
				if (value !== null) {
					cum.stats[sid.id] = value;
				}
			}
			if (value !== null) cum[sid.id] = value;

			return cum;
		},
		{
			coverImage: led?.song?.coverImage,
			mappers: led?.song?.mappers,
			fullCoverImage: led?.song?.fullCoverImage,
			downloadUrl: led?.song?.downloadUrl,
			explicity: led?.song?.explicity,
			videoPreviewUrl: led?.song?.videoPreviewUrl,
			stats: {},
		}
	);

	const leaderboardGroup = led?.leaderboardGroup?.sort((a, b) => b.timestamp - a.timestamp) ?? null;
	const topClan = led?.clan;

	const {stats, ...song} = songInfo;
	const leaderboard = {
		leaderboardId,
		song,
		diffInfo,
		stats,
		leaderboardGroup: leaderboardGroup,
		qualification: led.qualification,
		changes: led.changes,
		reweight: led.reweight,
		difficultyBl: led?.difficulty ?? null,
		topClan,
		clanRankingContested: led?.clanRankingContested ?? false,
	};

	const totalItems = led.plays;

	const scores = processLeaderboardScores(led?.scores);

	// let diffChartText = getFirstRegexpMatch(/'difficulty',\s*([0-9.,\s]+)\s*\]/, response.body.innerHTML)
	let diffChart = null; //(diffChartText ? diffChartText : '').split(',').map(i => parseFloat(i)).filter(i => i && !isNaN(i));

	return {
		diffs,
		leaderboard,
		diffChart,
		totalItems,
		scores,
	};
};
