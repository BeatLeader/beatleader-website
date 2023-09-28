import {default as createQueue, PRIORITY} from '../http-queue';
import {substituteVars} from '../../../utils/format';
import {PLAYER_SCORES_PER_PAGE, PLAYERS_PER_PAGE} from '../../../utils/beatleader/consts';
import {dateFromUnix, formatDateRelative, formatDateRelativeShort} from '../../../utils/date';
import {getDiffColor} from '../../../utils/beatleader/format';
import {fetchUrl} from '../../fetch';

export const CURRENT_URL = location.protocol + '//' + location.host;
export const BL_API_URL =
	CURRENT_URL == 'https://www.beatleader.xyz' || CURRENT_URL == 'http://localhost:8888' ? `https://api.beatleader.xyz/` : `/cors/blapi/`;
export const BL_SOCKET_URL = 'wss://api.beatleader.xyz/';
export const STEAM_API_URL = '/cors/steamapi';
export const STEAM_KEY = 'B0A7AF33E804D0ABBDE43BA9DD5DAB48';

export const BL_API_USER_URL = `${BL_API_URL}user`;
export const BL_API_PLAYER_INFO_URL = BL_API_URL + 'player/${playerId}?keepOriginalId=${keepOriginalId}';
export const BL_API_SCORES_URL =
	BL_API_URL +
	'player/${playerId}/scores?page=${page}&sortBy=${sort}&order=${order}&search=${search}&diff=${diff}&mode=${mode}&requirements=${requirements}&type=${songType}&modifiers=${modifiers}&stars_from=${starsFrom}&stars_to=${starsTo}&eventId=${eventId}&count=${count}';
export const BL_API_FRIENDS_SCORES_URL =
	BL_API_URL +
	'user/friendScores?page=${page}&sortBy=${sort}&order=${order}&search=${search}&diff=${diff}&type=${songType}&stars_from=${starsFrom}&stars_to=${starsTo}&count=${count}';
export const BL_API_SCORE_STATS_URL = BL_API_URL + 'score/statistic/${scoreId}';
export const BL_API_SCORE_PIN_URL =
	BL_API_URL + 'score/${scoreId}/pin?pin=${pin}&link=${link}&description=${description}&priority=${priority}';
export const BL_API_LEADERBOARD_STATS_URL = BL_API_URL + 'leaderboard/statistic/${leaderboardId}';
export const BL_API_PLAYER_SCORE_URL = BL_API_URL + 'score/${playerId}/${hash}/${diff}/${type}';
export const BL_API_SCORES_HISTOGRAM_URL =
	BL_API_URL +
	'player/${playerId}/histogram?sortBy=${sort}&order=${order}&search=${search}&diff=${diff}&type=${songType}&stars_from=${starsFrom}&stars_to=${starsTo}&batch=${batch}&count=${count}&eventId=${eventId}';
export const BL_API_FIND_PLAYER_URL = BL_API_URL + 'players?search=${query}&page=${page}&count=${count}&sortBy=${sortBy}&order=${order}';
export const BL_API_RANKING_URL =
	BL_API_URL +
	'players?page=${page}&count=${count}&sortBy=${sortBy}&mapsType=${mapsType}&ppType=${ppType}&order=${order}&countries=${countries}&friends=${friends}&search=${search}&platform=${platform}&role=${role}&hmd=${hmd}&pp_range=${pp_range}&score_range=${score_range}';
export const BL_API_EVENT_RANKING_URL =
	BL_API_URL +
	'event/${eventId}/players?page=${page}&sortBy=${sortBy}&mapsType=${mapsType}&order=${order}&countries=${countries}&friends=${friends}&search=${search}&platform=${platform}&role=${role}&hmd=${hmd}&pp_range=${pp_range}&score_range=${score_range}';
export const BL_API_LEADERBOARD_URL =
	BL_API_URL +
	'leaderboard/${leaderboardId}?page=${page}&countries=${countries}&friends=${friends}&voters=${voters}&sortBy=${sortBy}&order=${order}&search=${search}&modifiers=${modifiers}&count=${count}';
export const BL_API_LEADERBOARDS_URL =
	BL_API_URL +
	'leaderboards?page=${page}&count=${count}&type=${type}&search=${search}&stars_from=${stars_from}&stars_to=${stars_to}&accrating_from=${accrating_from}&accrating_to=${accrating_to}&passrating_from=${passrating_from}&passrating_to=${passrating_to}&techrating_from=${techrating_from}&techrating_to=${techrating_to}&date_from=${date_from}&date_to=${date_to}&sortBy=${sortBy}&order=${order}&mytype=${mytype}&count=${count}&mapType=${mapType}&mode=${mode}&allTypes=${allTypes}&mapRequirements=${mapRequirements}&allRequirements=${allRequirements}';
export const BL_API_LEADERBOARDS_GROUPPED_URL =
	BL_API_URL +
	'leaderboards/groupped?page=${page}&type=${type}&search=${search}&stars_from=${stars_from}&stars_to=${stars_to}&date_from=${date_from}&date_to=${date_to}&sortBy=${sortBy}&order=${order}&mytype=${mytype}&count=${count}&mapType=${mapType}&mode=${mode}&allTypes=${allTypes}&mapRequirements=${mapRequirements}&allRequirements=${allRequirements}';
export const BL_API_LEADERBOARDS_BY_HASH_URL = BL_API_URL + 'leaderboards/hash/${hash}';
export const BL_API_CLANS_URL = BL_API_URL + 'clans?page=${page}&search=${search}&sortBy=${sortBy}&order=${order}';
export const BL_API_CLAN_URL = BL_API_URL + 'clan/${clanId}?page=${page}';
export const BL_API_CLAN_CREATE_URL =
	BL_API_URL + 'clan/create?name=${name}&tag=${tag}&description=${description}&bio=${bio}&color=${color}';
export const BL_API_CLAN_UPDATE_URL = BL_API_URL + 'clan?name=${name}&tag=${tag}&description=${description}&bio=${bio}&color=${color}';
export const BL_API_CLAN_ACCEPT_URL = BL_API_URL + 'clan/accept?id=${id}';
export const BL_API_CLAN_REJECT_URL = BL_API_URL + 'clan/reject?id=${id}&ban=${ban}';
export const BL_API_CLAN_REMOVE_URL = BL_API_URL + 'clan';
export const BL_API_CLAN_LEAVE_URL = BL_API_URL + 'clan/leave?id=${id}';
export const BL_API_CLAN_UNBAN_URL = BL_API_URL + 'clan/unban?id=${id}';
export const BL_API_CLAN_KICK_URL = BL_API_URL + 'clan/kickplayer?player=${player}';
export const BL_API_CLAN_INVITE_URL = BL_API_URL + 'clan/invite?player=${player}';
export const BL_API_CLAN_CANCEL_INVITE_URL = BL_API_URL + 'clan/cancelinvite?player=${player}';
export const BL_API_ACC_GRAPH_URL = BL_API_URL + 'player/${player}/accgraph';
export const BL_API_FRIEND_ADD_URL = BL_API_URL + 'user/friend?playerId=${playerId}';
export const BL_API_FRIEND_REMOVE_URL = BL_API_URL + 'user/friend?playerId=${playerId}';
export const BL_API_MINIRANKINGS_URL =
	BL_API_URL + 'minirankings?rank=${rank}&country=${country}&countryRank=${countryRank}&friends=${friends}';
export const BL_API_EVENTS_URL = BL_API_URL + 'events?page=${page}&search=${search}&sortBy=${sortBy}&order=${order}';

export const STEAM_API_PROFILE_URL = STEAM_API_URL + '/ISteamUser/GetPlayerSummaries/v0002/?key=${steamKey}&steamids=${playerId}';
export const STEAM_API_GAME_INFO_URL = STEAM_API_URL + '/IPlayerService/GetRecentlyPlayedGames/v0001/?key=${steamKey}&steamid=${playerId}';

export const processLeaderboardScore = s => {
	if (!s) return null;

	let ret = {player: {playerInfo: {countries: []}}, score: {lastUpdated: new Date()}};

	ret.score.rank = s?.rank;

	const player = s.player;
	let country = player.country.toUpperCase();
	ret.player.playerInfo.country = country;
	ret.player.playerInfo.countries.push({country, rank: player.countryRank});
	ret.player.playerInfo.avatar = player.avatar;
	ret.player.playerInfo.bot = player.bot;
	ret.player.playerInfo.lastTwoWeekTime = player.lastTwoWeekTime;
	ret.player.playerInfo.pp = player.pp;
	ret.player.playerInfo.rank = player.rank;

	ret.player.name = player.name;
	ret.player.name = ret.player.name ? ret.player.name.trim().replace('&#039;', "'") : null;
	ret.player.playerId = player.id;
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
const processLeaderboard = (leaderboardId, page, respons) => {
	let led = respons.body;

	const diffs =
		led?.song?.difficulties.map(a => {
			let leaderboardId = led.song.id + '' + a.value + '' + a.mode;
			let diffAndType = {diff: a.difficultyName, type: a.modeName};
			let color = getDiffColor(diffAndType);
			return {name: diffAndType.diff.replace('Plus', '+'), type: diffAndType.type, leaderboardId, color};
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
		{id: 'levelAuthorName', value: led?.song?.mapper},
		{id: 'authorName', value: led?.song?.author},
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
		{imageUrl: led?.song?.coverImage, fullImageUrl: led?.song?.fullCoverImage, stats: {}}
	);

	const leaderboardGroup = led.leaderboardGroup.sort((a, b) => b.timestamp - a.timestamp);

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
	};

	const totalItems = led.plays;
	const pageQty = 10;

	const scores = processLeaderboardScores(led?.scores);

	// let diffChartText = getFirstRegexpMatch(/'difficulty',\s*([0-9.,\s]+)\s*\]/, response.body.innerHTML)
	let diffChart = null; //(diffChartText ? diffChartText : '').split(',').map(i => parseFloat(i)).filter(i => i && !isNaN(i));

	return {
		diffs,
		leaderboard,
		diffChart,
		page,
		pageQty,
		totalItems,
		scores,
	};
};

export default (options = {}) => {
	const queue = createQueue(options);

	const {fetchJson, fetchHtml, ...queueToReturn} = queue;

	const fetchScores = async (baseUrl, playerId, page = 1, priority = PRIORITY.FG_LOW, options = {}) =>
		fetchJson(substituteVars(baseUrl, {playerId, page}, true), {...options, credentials: 'include'}, priority);

	const user = async (priority = PRIORITY.FG_HIGH, options = {}) =>
		fetchJson(BL_API_USER_URL, {...options, retries: 0, credentials: 'include', maxAge: 1, cacheTtl: null}, priority);

	const player = async (playerId, priority = PRIORITY.FG_LOW, keepOriginalId = true, options = {}) =>
		fetchJson(substituteVars(BL_API_PLAYER_INFO_URL, {playerId, keepOriginalId}), options, priority);

	const steamProfile = async (playerId, priority = PRIORITY.FG_LOW, options = {}) =>
		fetchJson(substituteVars(STEAM_API_PROFILE_URL, {steamKey: STEAM_KEY, playerId}), options, priority);
	const gameInfo = async (playerId, priority = PRIORITY.FG_LOW, options = {}) =>
		fetchJson(substituteVars(STEAM_API_GAME_INFO_URL, {steamKey: STEAM_KEY, playerId}), options, priority);

	const scores = async (playerId, page = 1, params = {sort: 'date', order: 'desc', filter: {}}, priority = PRIORITY.FG_LOW, options = {}) =>
		fetchScores(
			substituteVars(playerId === 'user-friends' ? BL_API_FRIENDS_SCORES_URL : BL_API_SCORES_URL, {...params, ...(params?.filters ?? {})}),
			playerId,
			page,
			priority,
			options
		);

	const scoresHistogram = async (playerId, params = {sort: 'date', order: 'desc', filter: {}}, priority = PRIORITY.FG_LOW, options = {}) =>
		fetchScores(substituteVars(BL_API_SCORES_HISTOGRAM_URL, {...params, ...(params?.filters ?? {})}), playerId, priority, options);

	const scoreStats = async (scoreId, priority = PRIORITY.FG_LOW, options = {}) =>
		fetchJson(substituteVars(BL_API_SCORE_STATS_URL, {scoreId: encodeURIComponent(scoreId)}), options, priority);
	const leaderboardStats = async (leaderboardId, priority = PRIORITY.FG_LOW, options = {}) =>
		fetchJson(substituteVars(BL_API_LEADERBOARD_STATS_URL, {leaderboardId: encodeURIComponent(leaderboardId)}), options, priority);

	const playerScore = async (playerId, hash, diff, type, priority = PRIORITY.FG_LOW, options = {}) =>
		fetchJson(substituteVars(BL_API_PLAYER_SCORE_URL, {playerId, hash, diff, type}), options, priority);

	const findPlayer = async (query, priority = PRIORITY.FG_LOW, options = {}) =>
		fetchJson(
			substituteVars(BL_API_FIND_PLAYER_URL, {
				query: encodeURIComponent(query),
				page: options?.page ?? 1,
				count: options?.count ?? '',
				sortBy: options?.sortBy ?? 'pp',
				order: options?.order ?? 'desc',
			}),
			options,
			priority
		);

	const rankingGlobal = async (page = 1, filters = {sortBy: 'pp', count: 50}, priority = PRIORITY.FG_LOW, options = {}) => {
		return fetchJson(substituteVars(BL_API_RANKING_URL, {page, ...filters}, true, true), {...options, credentials: 'include'}, priority);
	};

	const rankingCountry = async (countries, page = 1, filters = {sortBy: 'pp'}, priority = PRIORITY.FG_LOW, options = {}) =>
		rankingGlobal(page, {...filters, countries}, priority, options);

	const rankingFollowed = async (page = 1, filters = {sortBy: 'pp'}, priority = PRIORITY.FG_LOW, options = {}) =>
		rankingGlobal(page, {...filters, friends: 'true'}, priority, {...options, credentials: 'include'});

	const rankingEventGlobal = async (page = 1, eventId = 1, filters = {sortBy: 'pp'}, priority = PRIORITY.FG_LOW, options = {}) => {
		return fetchJson(substituteVars(BL_API_EVENT_RANKING_URL, {page, eventId, ...filters}, true, true), options, priority);
	};

	const rankingEventCountry = async (
		countries,
		page = 1,
		eventId = 1,
		filters = {sortBy: 'pp'},
		priority = PRIORITY.FG_LOW,
		options = {}
	) => rankingEventGlobal(page, eventId, {...filters, countries}, priority, options);

	const rankingEventFollowed = async (page = 1, eventId = 1, filters = {sortBy: 'pp'}, priority = PRIORITY.FG_LOW, options = {}) =>
		rankingEventGlobal(page, eventId, {...filters, friends: 'true'}, priority, {...options, credentials: 'include'});

	const minirankings = async (rank, country, countryRank, friends, priority = PRIORITY.FG_LOW, options = {}) =>
		fetchJson(
			substituteVars(BL_API_MINIRANKINGS_URL, {rank, country, countryRank, friends}),
			{...options, credentials: 'include'},
			priority
		);

	const leaderboards = async (page = 1, filters = {}, priority = PRIORITY.FG_LOW, options = {}) => {
		return fetchJson(
			substituteVars(BL_API_LEADERBOARDS_URL, {page, count: 12, ...filters}, true, true),
			{...options, credentials: 'include'},
			priority
		);
	};

	const leaderboardsGrouped = async (page = 1, filters = {}, priority = PRIORITY.FG_LOW, options = {}) => {
		return fetchJson(
			substituteVars(BL_API_LEADERBOARDS_GROUPPED_URL, {page, ...filters}, true, true),
			{...options, credentials: 'include'},
			priority
		);
	};

	const leaderboardsByHash = async (hash, priority = PRIORITY.FG_LOW, options = {}) =>
		fetchJson(substituteVars(BL_API_LEADERBOARDS_BY_HASH_URL, {hash}), options, priority);

	const clans = async (page = 1, filters = {}, priority = PRIORITY.FG_LOW, options = {}) =>
		fetchJson(substituteVars(BL_API_CLANS_URL, {page, ...filters}, true, true), options, priority);

	const clan = async (clanId, page = 1, filters = {}, priority = PRIORITY.FG_LOW, options = {}) =>
		fetchJson(substituteVars(BL_API_CLAN_URL, {clanId, page, ...filters}), options, priority);

	const clanCreate = async (name, tag, description, bio, color, icon, priority = PRIORITY.FG_HIGH, options = {}) =>
		fetchJson(
			substituteVars(BL_API_CLAN_CREATE_URL, {name, tag, description, bio, color}, true, true, encodeURIComponent),
			{body: icon, ...options, retries: 0, method: 'POST', credentials: 'include', maxAge: 1, cacheTtl: null},
			priority
		);

	const clanUpdate = async (name, tag, description, bio, color, icon, priority = PRIORITY.FG_HIGH, options = {}) =>
		fetchHtml(
			substituteVars(BL_API_CLAN_UPDATE_URL, {name, tag, description, bio, color}, true, true, encodeURIComponent),
			{
				body: icon instanceof ArrayBuffer ? icon : null,
				...options,
				retries: 0,
				method: 'PUT',
				credentials: 'include',
				maxAge: 1,
				cacheTtl: null,
			},
			priority
		);

	const clanAccept = async (clanId, priority = PRIORITY.FG_HIGH, options = {}) =>
		fetchHtml(
			substituteVars(BL_API_CLAN_ACCEPT_URL, {id: clanId}, true, true, encodeURIComponent),
			{...options, retries: 0, method: 'POST', credentials: 'include', maxAge: 1, cacheTtl: null},
			priority
		);

	const clanReject = async (clanId, ban = false, priority = PRIORITY.FG_HIGH, options = {}) =>
		fetchHtml(
			substituteVars(BL_API_CLAN_REJECT_URL, {id: clanId, ban: ban ? 'true' : 'false'}, true, true, encodeURIComponent),
			{...options, retries: 0, method: 'POST', credentials: 'include', maxAge: 1, cacheTtl: null},
			priority
		);

	const clanRemove = async (priority = PRIORITY.FG_HIGH, options = {}) =>
		fetchHtml(
			BL_API_CLAN_REMOVE_URL,
			{...options, retries: 0, method: 'DELETE', credentials: 'include', maxAge: 1, cacheTtl: null},
			priority
		);

	const clanLeave = async (clanId, priority = PRIORITY.FG_HIGH, options = {}) =>
		fetchHtml(
			substituteVars(BL_API_CLAN_LEAVE_URL, {id: clanId}, true, true, encodeURIComponent),
			{...options, retries: 0, method: 'POST', credentials: 'include', maxAge: 1, cacheTtl: null},
			priority
		);

	const clanUnban = async (clanId, priority = PRIORITY.FG_HIGH, options = {}) =>
		fetchHtml(
			substituteVars(BL_API_CLAN_UNBAN_URL, {id: clanId}, true, true, encodeURIComponent),
			{...options, retries: 0, method: 'POST', credentials: 'include', maxAge: 1, cacheTtl: null},
			priority
		);

	const clanKick = async (playerId, priority = PRIORITY.FG_HIGH, options = {}) =>
		fetchHtml(
			substituteVars(BL_API_CLAN_KICK_URL, {player: playerId}, true, true, encodeURIComponent),
			{...options, retries: 0, method: 'POST', credentials: 'include', maxAge: 1, cacheTtl: null},
			priority
		);

	const clanInvite = async (playerId, priority = PRIORITY.FG_HIGH, options = {}) =>
		fetchHtml(
			substituteVars(BL_API_CLAN_INVITE_URL, {player: playerId}, true, true, encodeURIComponent),
			{...options, retries: 0, method: 'POST', credentials: 'include', maxAge: 1, cacheTtl: null},
			priority
		);

	const clanCancelInvite = async (playerId, priority = PRIORITY.FG_HIGH, options = {}) =>
		fetchHtml(
			substituteVars(BL_API_CLAN_CANCEL_INVITE_URL, {player: playerId}, true, true, encodeURIComponent),
			{...options, retries: 0, method: 'POST', credentials: 'include', maxAge: 1, cacheTtl: null},
			priority
		);

	const accGraph = async (playerId, priority = PRIORITY.FG_LOW, options = {}) =>
		fetchJson(substituteVars(BL_API_ACC_GRAPH_URL, {player: playerId}), {...options, credentials: 'include'}, priority);

	const leaderboard = async (leaderboardId, page = 1, filters = {}, priority = PRIORITY.FG_LOW, options = {}) =>
		fetchJson(
			substituteVars(BL_API_LEADERBOARD_URL, {leaderboardId, page, ...filters}, true, true),
			{...options, credentials: 'include'},
			priority
		).then(r => {
			r.body = processLeaderboard(leaderboardId, page, r);

			return r;
		});

	const addFollowed = async (playerId, priority = PRIORITY.FG_HIGH, options = {}) =>
		fetchHtml(
			substituteVars(BL_API_FRIEND_ADD_URL, {playerId}, true, true, encodeURIComponent),
			{...options, retries: 0, method: 'POST', credentials: 'include', maxAge: 1, cacheTtl: null},
			priority
		);

	const removeFollowed = async (playerId, priority = PRIORITY.FG_HIGH, options = {}) =>
		fetchHtml(
			substituteVars(BL_API_FRIEND_REMOVE_URL, {playerId}, true, true, encodeURIComponent),
			{...options, retries: 0, method: 'DELETE', credentials: 'include', maxAge: 1, cacheTtl: null},
			priority
		);

	const pinScore = async (
		scoreId,
		pin = true,
		description = null,
		link = null,
		service = null,
		pinPriority = 100,
		priority = PRIORITY.FG_HIGH,
		options = {}
	) =>
		fetchUrl(
			substituteVars(
				BL_API_SCORE_PIN_URL,
				{scoreId, pin, description, link, service, priority: pinPriority},
				true,
				'null-only',
				encodeURIComponent
			),
			{
				body: null,
				...options,
				retries: 0,
				method: 'PUT',
				credentials: 'include',
				maxAge: 1,
				cacheTtl: null,
			},
			priority
		);

	const events = async (page = 1, filters = {}, priority = PRIORITY.FG_LOW, options = {}) =>
		fetchJson(substituteVars(BL_API_EVENTS_URL, {page, ...filters}, true, true), options, priority);

	return {
		user,
		player,
		steamProfile,
		gameInfo,
		findPlayer,
		rankingGlobal,
		rankingCountry,
		rankingFollowed,
		rankingEventGlobal,
		rankingEventCountry,
		rankingEventFollowed,
		scores,
		scoreStats,
		leaderboardStats,
		scoresHistogram,
		playerScore,
		leaderboards,
		leaderboardsGrouped,
		leaderboard,
		leaderboardsByHash,
		clans,
		clan,
		clanCreate,
		clanUpdate,
		clanAccept,
		clanReject,
		clanRemove,
		clanLeave,
		clanUnban,
		clanKick,
		clanInvite,
		clanCancelInvite,
		accGraph,
		addFollowed,
		removeFollowed,
		minirankings,
		pinScore,
		events,
		BL_API_URL,
		PLAYER_SCORES_PER_PAGE,
		PLAYERS_PER_PAGE,
		...queueToReturn,
	};
};
