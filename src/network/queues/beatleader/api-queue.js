import {default as createQueue, PRIORITY} from '../http-queue';
import {substituteVarsUrl} from '../../../utils/format';
import {PLAYER_SCORES_PER_PAGE, PLAYERS_PER_PAGE} from '../../../utils/beatleader/consts';
import {fetchUrl} from '../../fetch';

export const CURRENT_URL = location.protocol + '//' + location.host;
export const BL_API_URL = (() => {
	if (location.host.includes('localhost') || location.host.includes('beatleader.com')) {
		return 'https://api.beatleader.com/';
	} else if (location.host.includes('stage')) {
		return 'https://stage.api.beatleader.net/';
	} else if (location.host.includes('beatleader.net')) {
		return 'https://api.beatleader.net/';
	} else if (location.host.includes('beatleader.xyz')) {
		return 'https://api.beatleader.xyz/';
	} else {
		return '/cors/blapi/';
	}
})();
export const BL_REPLAYS_URL = (() => {
	if (location.host.includes('stage')) {
		return 'https://stage.replay.beatleader.net/';
	} else if (location.host.includes('beatleader.net')) {
		return 'https://replay.beatleader.net/';
	} else if (location.host.includes('beatleader.xyz')) {
		return 'https://replay.beatleader.xyz/';
	} else {
		return 'https://replay.beatleader.com/';
	}
})();
export const BL_ANALYZER_URL = (() => {
	if (location.host.includes('stage')) {
		return 'https://stage.analyzer.beatleader.net/';
	} else if (location.host.includes('beatleader.net')) {
		return 'https://analyzer.beatleader.net/';
	} else if (location.host.includes('beatleader.xyz')) {
		return 'https://analyzer.beatleader.xyz/';
	} else {
		return 'https://analyzer.beatleader.com/';
	}
})();

export const BL_RENDERER_API_URL = (() => {
	if (location.host.includes('stage')) {
		return 'https://stage.render.beatleader.net/';
	} else if (location.host.includes('beatleader.net')) {
		return 'https://render.beatleader.net/';
	} else if (location.host.includes('beatleader.xyz')) {
		return 'https://render.beatleader.xyz/';
	} else {
		return 'https://render.beatleader.com/';
	}
})();
export const BL_SOCKET_URL = 'wss://sockets.api.beatleader.xyz/';
export const STEAM_API_URL = '/cors/steamapi';
export const STEAM_KEY = 'B0A7AF33E804D0ABBDE43BA9DD5DAB48';

export const SPECIAL_PLAYER_ID = 'user-friends';
export const ALL_SCORES_PLAYER_ID = 'all-scores';

export const BL_API_USER_URL = `${BL_API_URL}user`;
export const BL_API_PLAYER_INFO_URL = BL_API_URL + 'player/${playerId}?leaderboardContext=${leaderboardContext}';
export const BL_API_PLAYER_SAVER_INFO_URL = BL_API_URL + 'player/beatsaver/${playerId}?leaderboardContext=${leaderboardContext}';
export const BL_API_SCORES_URL =
	BL_API_URL +
	'player/${playerId}/scores?leaderboardContext=${leaderboardContext}&page=${page}&sortBy=${sort}&order=${order}&search=${search}&diff=${diff}&mode=${mode}&requirements=${requirements}&type=${songType}&hmd=${hmd}&modifiers=${modifiers}&stars_from=${starsFrom}&stars_to=${starsTo}&eventId=${eventId}&count=${count}&includeIO=true';
export const BL_API_SCORE_ATTEMPTS_URL =
	BL_API_URL +
	'player/${playerId}/scoresstats?page=${page}&sortBy=${sort}&order=${order}&search=${search}&diff=${diff}&mode=${mode}&requirements=${requirements}&type=${songType}&endType=${endType}&modifiers=${modifiers}&stars_from=${starsFrom}&stars_to=${starsTo}&eventId=${eventId}&count=${count}';
export const BL_API_FRIENDS_SCORES_URL =
	BL_API_URL +
	'user/friendScores?leaderboardContext=${leaderboardContext}&page=${page}&sortBy=${sort}&order=${order}&search=${search}&diff=${diff}&type=${songType}&hmd=${hmd}&stars_from=${starsFrom}&stars_to=${starsTo}&count=${count}';
export const BL_API_ALL_SCORES_URL =
	BL_API_URL +
	'scores/all?leaderboardContext=${leaderboardContext}&page=${page}&sortBy=${sort}&order=${order}&search=${search}&mapRequirements=${mapRequirements}&date_from=${date_from}&date_to=${date_to}&diff=${diff}&mode=${mode}&type=${type}&mapType=${mapType}&allTypes=${allTypes}&hmd=${hmd}&stars_from=${stars_from}&stars_to=${stars_to}&accrating_from=${accrating_from}&accrating_to=${accrating_to}&passrating_from=${passrating_from}&passrating_to=${passrating_to}&techrating_from=${techrating_from}&techrating_to=${techrating_to}&count=${count}&modifiers=${modifiers}&mappers=${mappers}&players=${players}';
export const BL_API_SCORE_STATS_URL = 'https://cdn.scorestats.beatleader.xyz/${scoreId}.json';
export const BL_API_SCORE_PIN_URL =
	BL_API_URL +
	'score/${scoreId}/pin?pin=${pin}&leaderboardContext=${leaderboardContext}&link=${link}&description=${description}&priority=${priority}';
export const BL_API_LEADERBOARD_STATS_URL = BL_API_URL + 'leaderboard/statistic/${leaderboardId}';
export const BL_API_PLAYER_SCORE_URL = BL_API_URL + 'score/${playerId}/${hash}/${diff}/${type}?leaderboardContext=${leaderboardContext}';
export const BL_API_SCORES_HISTOGRAM_URL =
	BL_API_URL +
	'player/${playerId}/histogram?leaderboardContext=${leaderboardContext}&sortBy=${sort}&order=${order}&search=${search}&diff=${diff}&type=${songType}&hmd=${hmd}&stars_from=${starsFrom}&stars_to=${starsTo}&batch=${batch}&count=${count}&eventId=${eventId}';
export const BL_API_FIND_PLAYER_URL =
	BL_API_URL +
	'players?search=${query}&leaderboardContext=${leaderboardContext}&page=${page}&count=${count}&sortBy=${sortBy}&order=${order}';
export const BL_API_RANKING_URL =
	BL_API_URL +
	'players?leaderboardContext=${leaderboardContext}&page=${page}&count=${count}&sortBy=${sortBy}&mapsType=${mapsType}&ppType=${ppType}&order=${order}&countries=${countries}&friends=${friends}&search=${search}&platform=${platform}&role=${role}&hmd=${hmd}&firstScoreTime=${firstScoreTime}&recentScoreTime=${recentScoreTime}&pp_range=${pp_range}&score_range=${score_range}';
export const BL_API_EVENT_RANKING_URL =
	BL_API_URL +
	'event/${eventId}/players?page=${page}&sortBy=${sortBy}&mapsType=${mapsType}&order=${order}&countries=${countries}&friends=${friends}&search=${search}&platform=${platform}&role=${role}&hmd=${hmd}&pp_range=${pp_range}&score_range=${score_range}';
export const BL_API_CLAN_RANKING_URL = BL_API_URL + 'leaderboard/clanRankings/${leaderboardId}?page=${page}';
export const BL_API_CLAN_RANKING_SCORES_URL = BL_API_URL + 'leaderboard/clanRankings/${leaderboardId}/${clanRankingId}?page=${page}';
export const BL_API_LEADERBOARD_URL =
	BL_API_URL +
	'leaderboard/${leaderboardId}?leaderboardContext=${leaderboardContext}&page=${page}&countries=${countries}&clanTag=${clanTag}&friends=${friends}&voters=${voters}&prediction=${prediction}&sortBy=${sortBy}&order=${order}&search=${search}&modifiers=${modifiers}&hmds=${hmds}&count=${count}';
export const BL_API_LEADERBOARDS_URL =
	BL_API_URL +
	'leaderboards?leaderboardContext=${leaderboardContext}&page=${page}&type=${type}&search=${search}&stars_from=${stars_from}&stars_to=${stars_to}&accrating_from=${accrating_from}&accrating_to=${accrating_to}&passrating_from=${passrating_from}&passrating_to=${passrating_to}&techrating_from=${techrating_from}&techrating_to=${techrating_to}&date_from=${date_from}&date_to=${date_to}&sortBy=${sortBy}&order=${order}&mytype=${mytype}&count=${count}&mapType=${mapType}&mode=${mode}&difficulty=${difficulty}&allTypes=${allTypes}&songStatus=${songStatus}&mapRequirements=${mapRequirements}&allRequirements=${allRequirements}&mappers=${mappers}&playlistIds=${playlistIds}';
export const BL_API_LEADERBOARDS_GROUPPED_URL =
	BL_API_URL +
	'leaderboards/groupped?page=${page}&type=${type}&search=${search}&stars_from=${stars_from}&stars_to=${stars_to}&date_from=${date_from}&date_to=${date_to}&sortBy=${sortBy}&order=${order}&mytype=${mytype}&count=${count}&mapType=${mapType}&mode=${mode}&difficulty=${difficulty}&allTypes=${allTypes}&songStatus=${songStatus}&mapRequirements=${mapRequirements}&allRequirements=${allRequirements}';
export const BL_API_LEADERBOARDS_BY_HASH_URL = BL_API_URL + 'leaderboards/hash/${hash}?my_scores=${my_scores}';
export const BL_API_CLANS_URL =
	BL_API_URL + 'clans?leaderboardContext=${leaderboardContext}&page=${page}&search=${search}&sortBy=${sortBy}&order=${order}';
export const BL_API_CLAN_URL =
	BL_API_URL + 'clan/${clanId}?leaderboardContext=${leaderboardContext}&page=${page}&sortBy=${sortBy}&order=${order}&primary=${primary}';
export const BL_API_CLAN_MAPS_URL =
	BL_API_URL +
	'clan/${clanId}/maps?leaderboardContext=${leaderboardContext}&page=${page}&sortBy=${sortBy}&order=${order}&primary=${primary}&playedStatus=${playedStatus}';
export const BL_API_CLAN_CREATE_URL =
	BL_API_URL +
	'clan/create?name=${name}&tag=${tag}&description=${description}&bio=${bio}&color=${color}&playerChangesCallback=${playerChangesCallback}&clanRankingDiscordHook=${clanRankingDiscordHook}';
export const BL_API_CLAN_UPDATE_URL =
	BL_API_URL +
	'clan?name=${name}&tag=${tag}&description=${description}&bio=${bio}&color=${color}&playerChangesCallback=${playerChangesCallback}&clanRankingDiscordHook=${clanRankingDiscordHook}';
export const BL_API_CLAN_ACCEPT_URL = BL_API_URL + 'clan/accept?id=${id}';
export const BL_API_CLAN_REJECT_URL = BL_API_URL + 'clan/reject?id=${id}&ban=${ban}';
export const BL_API_CLAN_EDIT_BIO = BL_API_URL + 'clan/richbio';
export const BL_API_CLAN_UPDATE_PLAYLIST_URL = BL_API_URL + 'clan/playlist?id=${id}&title=${title}&description=${description}&link=${link}';
export const BL_API_CLAN_REMOVE_URL = BL_API_URL + 'clan';
export const BL_API_CLAN_LEAVE_URL = BL_API_URL + 'clan/leave?id=${id}';
export const BL_API_CLAN_UNBAN_URL = BL_API_URL + 'clan/unban?id=${id}';
export const BL_API_CLAN_KICK_URL = BL_API_URL + 'clan/kickplayer?player=${player}';
export const BL_API_CLAN_INVITE_URL = BL_API_URL + 'clan/invite?player=${player}';
export const BL_API_CLAN_CANCEL_INVITE_URL = BL_API_URL + 'clan/cancelinvite?player=${player}';
export const BL_API_ACC_GRAPH_URL =
	BL_API_URL + 'player/${player}/accgraph?leaderboardContext=${leaderboardContext}&type=${type}&no_unranked_stars=${no_unranked_stars}';
export const BL_API_FRIEND_ADD_URL = BL_API_URL + 'user/friend?playerId=${playerId}';
export const BL_API_FRIEND_REMOVE_URL = BL_API_URL + 'user/friend?playerId=${playerId}';
export const BL_API_MINIRANKINGS_URL =
	BL_API_URL +
	'minirankings?rank=${rank}&leaderboardContext=${leaderboardContext}&country=${country}&countryRank=${countryRank}&friends=${friends}';
export const BL_API_EVENTS_URL = BL_API_URL + 'events?page=${page}&search=${search}&sortBy=${sortBy}&order=${order}';

export const STEAM_API_PROFILE_URL = STEAM_API_URL + '/ISteamUser/GetPlayerSummaries/v0002/?key=${steamKey}&steamids=${playerId}';
export const STEAM_API_GAME_INFO_URL = STEAM_API_URL + '/IPlayerService/GetRecentlyPlayedGames/v0001/?key=${steamKey}&steamid=${playerId}';

export default (options = {}) => {
	const queue = createQueue(options);

	const {fetchJson, fetchHtml, ...queueToReturn} = queue;

	const fetchScores = async (baseUrl, playerId, page = 1, priority = PRIORITY.FG_LOW, options = {}) =>
		fetchJson(substituteVarsUrl(baseUrl, {playerId, page}, true), {...options, credentials: 'include'}, priority);

	const user = async (priority = PRIORITY.FG_HIGH, options = {}) =>
		fetchJson(BL_API_USER_URL, {...options, retries: 0, credentials: 'include', maxAge: 1, cacheTtl: null}, priority);

	const player = async (playerId, priority = PRIORITY.FG_LOW, options = {}) =>
		fetchJson(substituteVarsUrl(BL_API_PLAYER_INFO_URL, {playerId}), options, priority);

	const playerBySaver = async (playerId, priority = PRIORITY.FG_LOW, options = {}) =>
		fetchJson(substituteVarsUrl(BL_API_PLAYER_SAVER_INFO_URL, {playerId}), options, priority);

	const steamProfile = async (playerId, priority = PRIORITY.FG_LOW, options = {}) =>
		fetchJson(substituteVarsUrl(STEAM_API_PROFILE_URL, {steamKey: STEAM_KEY, playerId}), options, priority);
	const gameInfo = async (playerId, priority = PRIORITY.FG_LOW, options = {}) =>
		fetchJson(substituteVarsUrl(STEAM_API_GAME_INFO_URL, {steamKey: STEAM_KEY, playerId}), options, priority);

	const scores = async (playerId, page = 1, params = {sort: 'date', order: 'desc', filter: {}}, priority = PRIORITY.FG_LOW, options = {}) =>
		fetchScores(
			substituteVarsUrl(
				playerId === SPECIAL_PLAYER_ID
					? BL_API_FRIENDS_SCORES_URL
					: playerId === ALL_SCORES_PLAYER_ID
						? BL_API_ALL_SCORES_URL
						: BL_API_SCORES_URL,
				{
					...params,
					...(params?.filters ?? {}),
					count: PLAYER_SCORES_PER_PAGE,
				}
			),
			playerId,
			page,
			priority,
			options
		);
	const scoreAttempts = async (
		playerId,
		page = 1,
		params = {sort: 'date', order: 'desc', filter: {}},
		priority = PRIORITY.FG_LOW,
		options = {}
	) =>
		fetchScores(substituteVarsUrl(BL_API_SCORE_ATTEMPTS_URL, {...params, ...(params?.filters ?? {})}), playerId, page, priority, options);

	const scoresHistogram = async (playerId, params = {sort: 'date', order: 'desc', filter: {}}, priority = PRIORITY.FG_LOW, options = {}) =>
		fetchScores(substituteVarsUrl(BL_API_SCORES_HISTOGRAM_URL, {...params, ...(params?.filters ?? {})}), playerId, priority, options);

	const scoreStats = async (scoreId, priority = PRIORITY.FG_LOW, options = {}) =>
		fetchJson(substituteVarsUrl(BL_API_SCORE_STATS_URL, {scoreId: scoreId}), options, priority);
	const leaderboardStats = async (leaderboardId, priority = PRIORITY.FG_LOW, options = {}) =>
		fetchJson(
			substituteVarsUrl(BL_API_LEADERBOARD_STATS_URL, {leaderboardId: leaderboardId}),
			{...options, credentials: 'include'},
			priority
		);

	const playerScore = async (playerId, hash, diff, type, priority = PRIORITY.FG_LOW, options = {}) =>
		fetchJson(substituteVarsUrl(BL_API_PLAYER_SCORE_URL, {playerId, hash, diff, type}), options, priority);

	const findPlayer = async (query, priority = PRIORITY.FG_LOW, options = {}) =>
		fetchJson(
			substituteVarsUrl(BL_API_FIND_PLAYER_URL, {
				query: query,
				page: options?.page ?? 1,
				count: options?.count ?? '',
				sortBy: options?.sortBy ?? 'pp',
				order: options?.order ?? 'desc',
			}),
			options,
			priority
		);

	const rankingGlobal = async (count = 50, page = 1, filters = {sortBy: 'pp', count: 50}, priority = PRIORITY.FG_LOW, options = {}) => {
		return fetchJson(
			substituteVarsUrl(BL_API_RANKING_URL, {page, count, ...filters}, true, true),
			{...options, credentials: 'include'},
			priority
		);
	};

	const rankingCountry = async (count = 50, countries, page = 1, filters = {sortBy: 'pp'}, priority = PRIORITY.FG_LOW, options = {}) =>
		rankingGlobal(count, page, {...filters, countries}, priority, options);

	const rankingFollowed = async (count = 50, page = 1, filters = {sortBy: 'pp'}, priority = PRIORITY.FG_LOW, options = {}) =>
		rankingGlobal(count, page, {...filters, friends: 'true'}, priority, {...options, credentials: 'include'});

	const rankingEventGlobal = async (page = 1, eventId = 1, filters = {sortBy: 'pp'}, priority = PRIORITY.FG_LOW, options = {}) => {
		return fetchJson(substituteVarsUrl(BL_API_EVENT_RANKING_URL, {page, eventId, ...filters}, true, true), options, priority);
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
			substituteVarsUrl(BL_API_MINIRANKINGS_URL, {rank, country, countryRank, friends}),
			{...options, credentials: 'include'},
			priority
		);

	const leaderboards = async (page = 1, filters = {}, priority = PRIORITY.FG_LOW, options = {}) => {
		return fetchJson(
			substituteVarsUrl(BL_API_LEADERBOARDS_URL, {page, count: 12, ...filters}, true, true),
			{...options, credentials: 'include'},
			priority
		);
	};

	const leaderboardsGrouped = async (page = 1, filters = {}, priority = PRIORITY.FG_LOW, options = {}) => {
		return fetchJson(
			substituteVarsUrl(BL_API_LEADERBOARDS_GROUPPED_URL, {page, ...filters}, true, true),
			{...options, credentials: 'include'},
			priority
		);
	};

	const leaderboardsByHash = async (hash, my_scores, priority = PRIORITY.FG_LOW, options = {}) =>
		fetchJson(substituteVarsUrl(BL_API_LEADERBOARDS_BY_HASH_URL, {hash, my_scores}), {...options, credentials: 'include'}, priority);

	const clans = async (page = 1, filters = {}, priority = PRIORITY.FG_LOW, options = {}) =>
		fetchJson(substituteVarsUrl(BL_API_CLANS_URL, {page, ...filters}, true, true), {...options, credentials: 'include'}, priority);

	const clan = async (clanId, page = 1, filters = {}, priority = PRIORITY.FG_LOW, options = {}) =>
		fetchJson(substituteVarsUrl(BL_API_CLAN_URL, {clanId, page, ...filters}), {...options, credentials: 'include'}, priority);
	const clanMaps = async (clanId, page = 1, filters = {}, priority = PRIORITY.FG_LOW, options = {}) =>
		fetchJson(substituteVarsUrl(BL_API_CLAN_MAPS_URL, {clanId, page, ...filters}), {...options, credentials: 'include'}, priority);

	const clanCreate = async (
		name,
		tag,
		description,
		bio,
		color,
		icon,
		playerChangesCallback,
		clanRankingDiscordHook,
		priority = PRIORITY.FG_HIGH,
		options = {}
	) =>
		fetchJson(
			substituteVarsUrl(
				BL_API_CLAN_CREATE_URL,
				{name, tag, description, bio, color, playerChangesCallback, clanRankingDiscordHook},
				true,
				true
			),
			{body: icon, ...options, retries: 0, method: 'POST', credentials: 'include', maxAge: 1, cacheTtl: null},
			priority
		);

	const clanUpdate = async (
		name,
		tag,
		description,
		bio,
		color,
		icon,
		playerChangesCallback,
		clanRankingDiscordHook,
		priority = PRIORITY.FG_HIGH,
		options = {}
	) =>
		fetchHtml(
			substituteVarsUrl(
				BL_API_CLAN_UPDATE_URL,
				{name, tag, description, bio, color, playerChangesCallback, clanRankingDiscordHook},
				true,
				true
			),
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

	const clanEditRichBio = async (value, priority = PRIORITY.FG_HIGH, options = {}) =>
		fetchHtml(
			BL_API_CLAN_EDIT_BIO,
			{...options, body: value, retries: 0, method: 'PUT', credentials: 'include', maxAge: 1, cacheTtl: null},
			priority
		);

	const clanUpdatePlaylist = async (id, title, link, description, icon, priority = PRIORITY.FG_HIGH, options = {}) =>
		fetchHtml(
			substituteVarsUrl(BL_API_CLAN_UPDATE_PLAYLIST_URL, {id, title, link, description}, true, true),
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
	const clanDeletePlaylist = async (id, priority = PRIORITY.FG_HIGH, options = {}) =>
		fetchHtml(
			substituteVarsUrl(BL_API_CLAN_UPDATE_PLAYLIST_URL, {id}, true, true),
			{
				...options,
				retries: 0,
				method: 'DELETE',
				credentials: 'include',
				maxAge: 1,
				cacheTtl: null,
			},
			priority
		);
	const clanAccept = async (clanId, priority = PRIORITY.FG_HIGH, options = {}) =>
		fetchHtml(
			substituteVarsUrl(BL_API_CLAN_ACCEPT_URL, {id: clanId}, true, true),
			{...options, retries: 0, method: 'POST', credentials: 'include', maxAge: 1, cacheTtl: null},
			priority
		);

	const clanReject = async (clanId, ban = false, priority = PRIORITY.FG_HIGH, options = {}) =>
		fetchHtml(
			substituteVarsUrl(BL_API_CLAN_REJECT_URL, {id: clanId, ban: ban ? 'true' : 'false'}, true, true),
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
			substituteVarsUrl(BL_API_CLAN_LEAVE_URL, {id: clanId}, true, true),
			{...options, retries: 0, method: 'POST', credentials: 'include', maxAge: 1, cacheTtl: null},
			priority
		);

	const clanUnban = async (clanId, priority = PRIORITY.FG_HIGH, options = {}) =>
		fetchHtml(
			substituteVarsUrl(BL_API_CLAN_UNBAN_URL, {id: clanId}, true, true),
			{...options, retries: 0, method: 'POST', credentials: 'include', maxAge: 1, cacheTtl: null},
			priority
		);

	const clanKick = async (playerId, priority = PRIORITY.FG_HIGH, options = {}) =>
		fetchHtml(
			substituteVarsUrl(BL_API_CLAN_KICK_URL, {player: playerId}, true, true),
			{...options, retries: 0, method: 'POST', credentials: 'include', maxAge: 1, cacheTtl: null},
			priority
		);

	const clanInvite = async (playerId, priority = PRIORITY.FG_HIGH, options = {}) =>
		fetchHtml(
			substituteVarsUrl(BL_API_CLAN_INVITE_URL, {player: playerId}, true, true),
			{...options, retries: 0, method: 'POST', credentials: 'include', maxAge: 1, cacheTtl: null},
			priority
		);

	const clanCancelInvite = async (playerId, priority = PRIORITY.FG_HIGH, options = {}) =>
		fetchHtml(
			substituteVarsUrl(BL_API_CLAN_CANCEL_INVITE_URL, {player: playerId}, true, true),
			{...options, retries: 0, method: 'POST', credentials: 'include', maxAge: 1, cacheTtl: null},
			priority
		);

	const clanRanking = async (leaderboardId, page = 1, priority = PRIORITY.FG_LOW, options = {}) =>
		fetchJson(
			substituteVarsUrl(BL_API_CLAN_RANKING_URL, {leaderboardId, page}, true, true),
			{...options, credentials: 'include'},
			priority
		);

	const clanRankingScores = async (leaderboardId, clanRankingId, page = 1, priority = PRIORITY.FG_LOW, options = {}) =>
		fetchJson(
			substituteVarsUrl(BL_API_CLAN_RANKING_SCORES_URL, {leaderboardId, clanRankingId, page}, true, true),
			{...options, credentials: 'include'},
			priority
		);

	const accGraph = async (playerId, type, no_unranked_stars, priority = PRIORITY.FG_LOW, options = {}) =>
		fetchJson(
			substituteVarsUrl(BL_API_ACC_GRAPH_URL, {player: playerId, type, no_unranked_stars}),
			{...options, credentials: 'include'},
			priority
		);

	const rankGraph = async (playerId, priority = PRIORITY.FG_LOW, options = {}) =>
		fetchJson(substituteVarsUrl(BL_API_RANK_GRAPH_URL, {player: playerId}), {...options, credentials: 'include'}, priority);

	const leaderboard = async (leaderboardId, page = 1, filters = {}, priority = PRIORITY.FG_LOW, options = {}) =>
		fetchJson(
			substituteVarsUrl(BL_API_LEADERBOARD_URL, {leaderboardId, page, ...filters}, true, true),
			{...options, credentials: 'include'},
			priority
		);

	const addFollowed = async (playerId, priority = PRIORITY.FG_HIGH, options = {}) =>
		fetchHtml(
			substituteVarsUrl(BL_API_FRIEND_ADD_URL, {playerId}, true, true),
			{...options, retries: 0, method: 'POST', credentials: 'include', maxAge: 1, cacheTtl: null},
			priority
		);

	const removeFollowed = async (playerId, priority = PRIORITY.FG_HIGH, options = {}) =>
		fetchHtml(
			substituteVarsUrl(BL_API_FRIEND_REMOVE_URL, {playerId}, true, true),
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
			substituteVarsUrl(BL_API_SCORE_PIN_URL, {scoreId, pin, description, link, service, priority: pinPriority}, true, 'null-only'),
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
		fetchJson(substituteVarsUrl(BL_API_EVENTS_URL, {page, ...filters}, true, true), options, priority);

	return {
		user,

		player,
		playerBySaver,

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
		scoreAttempts,
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
		clanMaps,
		clanRanking,
		clanRankingScores,
		clanCreate,
		clanUpdate,
		clanEditRichBio,
		clanUpdatePlaylist,
		clanDeletePlaylist,
		clanAccept,
		clanReject,
		clanRemove,
		clanLeave,
		clanUnban,
		clanKick,
		clanInvite,
		clanCancelInvite,
		accGraph,
		rankGraph,
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
