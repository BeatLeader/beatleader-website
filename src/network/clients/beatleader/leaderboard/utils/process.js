import {getDiffColor} from '../../../../../utils/beatleader/format'
import {dateFromUnix, formatDateRelative} from '../../../../../utils/date'

export const processLeaderboardScore = s => {
	if (!s) return null;

	let ret = {player: {playerInfo: {countries: []}}, score: {lastUpdated: new Date()}};

	ret.score.rank = s?.rank;

	const player = s.player;
	let country = player.country.toUpperCase();
	ret.player.playerInfo.country = country
	ret.player.playerInfo.countries.push({country, rank: player.countryRank});
	ret.player.playerInfo.avatar = player.avatar;
	ret.player.playerInfo.allTime = player.allTime;
	ret.player.playerInfo.lastTwoWeekTime = player.lastTwoWeekTime;

	ret.player.name = player.name;
	ret.player.name = ret.player.name ? ret.player.name.trim().replace('&#039;', "'") : null;
	ret.player.playerId = player.id;
	ret.player.playerId = ret.player.playerId ? ret.player.playerId.trim() : null;

	ret.player.clans = player?.clans ?? null;

	ret.score.score = s.modifiedScore;

	ret.score.timeSetString = formatDateRelative(dateFromUnix(s.timeset));
	ret.score.timeSet = s.timeset;
	if (ret.score.timeSetString) ret.score.timeSetString = ret.score.timeSetString.trim();

	ret.score.mods = s.modifiers && s.modifiers.length ? s.modifiers.split(',').filter(m => m && m.trim().length) : null;

	ret.score.pp = s.pp;
	ret.score.acc = s.accuracy * 100;

	ret.score.id = s?.id ?? null;

	ret.score = {...s, ...ret.score}

	let {unmodififiedScore: unmodifiedScore, mods, ...score} = ret.score;

	if (mods && typeof mods === 'string') mods = mods.split(',').map(m => m.trim().toUpperCase()).filter(m => m.length);
	else if (!mods) mods = null;


	const ppWeighted = score?.pp && score?.weight ? score.pp * score.weight : null;

	return {
		...ret,
		score: {...score, unmodifiedScore: unmodifiedScore || null, mods, ppWeighted},
	};
}

const processLeaderboard = response => {
	if (!response) return null;

	const leaderboardId = response?.id;

	const currentDiff = response?.difficulty;

	const diffs = response?.song?.difficulties.map(a => {
		let leaderboardId = response.song.id + "" + a.value + "" + a.mode;
		let diffAndType = {diff: a.difficultyName, type: a.modeName};
		let color = getDiffColor(diffAndType);
		return {name: diffAndType.diff.replace('Plus', '+'), type: diffAndType.type, leaderboardId, color};
	}) ?? null;

	let diff = null;
	let diffInfo = null;
	if (currentDiff) {
		diffInfo = {diff: currentDiff?.difficultyName, type: currentDiff?.modeName};
	}

	const songInfo = [
		{id: 'hash', value: response?.song?.hash},
		{id: 'id', value: response?.song?.id},
		{id: 'scores', value: response.plays},
		{id: 'status', value: currentDiff?.ranked ? "Ranked" : "Not Ranked"},
		{id: 'totalScores', value: response.plays},
		{id: 'notes', value: currentDiff?.notes},
		{id: 'bpm', value: response?.song?.bpm},
		{id: 'stars', value: currentDiff?.stars},
		{id: 'levelAuthorName', value: response?.song?.mapper},
		{id: 'authorName', value: response.song.author},
		{id: 'duration', value: response?.song?.duration},
		{id: 'name', value: response.song.name}]
		.reduce((cum, sid) => {
			let value = sid.value;

			if (value !== null && ['scores', 'totalScores', 'bpm', 'notes', 'stars', 'status'].includes(sid.id)) {

				if (value !== null) {
					cum.stats[sid.id] = value;
				}

				return cum;
			}
			if (value !== null) cum[sid.id] = value;

			return cum;
		}, {imageUrl: response.song.coverImage, stats: {}, difficulties: response?.song?.difficulties ?? []});

	const {stats, ...song} = songInfo;
	const leaderboard = {leaderboardId, song, diffInfo, stats, difficulty: currentDiff};

	const totalItems = response.plays;

	let diffChart = null;

	return {
		diffs,
		leaderboard,
		diffChart,
		totalItems,
		scores: response?.scores ?? null,
	}
}

export const process = response => {
	if (!response?.id || !response?.scores || !Array.isArray(response.scores)) return null;

	response = processLeaderboard(response);

	const scores = response.scores.map(processLeaderboardScore);

	return {
		...response,
		scores,
	}
}