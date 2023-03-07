import leaderboardApiClient from '../../network/clients/beatleader/leaderboard/api-leaderboard';
import leaderboardsApiClient from '../../network/clients/beatleader/leaderboard/api-leaderboards';
import accSaberLeaderboardApiClient from '../../network/clients/accsaber/api-leaderboard';
import statsApiClient from '../../network/clients/beatleader/leaderboard/api-stats';
import makePendingPromisePool from '../../utils/pending-promises';
import {PRIORITY} from '../../network/queues/http-queue';
import {LEADERBOARD_SCORES_PER_PAGE} from '../../utils/beatleader/consts';
import {LEADERBOARD_SCORES_PER_PAGE as ACCSABER_LEADERBOARD_SCORES_PER_PAGE} from '../../utils/accsaber/consts';
import {MINUTE, HOUR} from '../../utils/date';
import stringify from 'json-stable-stringify';

const ACCSABER_LEADERBOARD_NETWORK_TTL = MINUTE * 5;

let service = null;
export default () => {
	if (service) return service;

	const resolvePromiseOrWaitForPending = makePendingPromisePool();

	const fetchAllLeaderboardsPage = async (page = 1, filters = {}, priority = PRIORITY.FG_LOW, signal = null, force = false) =>
		resolvePromiseOrWaitForPending(`apiClient/leaderboards/${page}`, () =>
			leaderboardsApiClient.getProcessed({page, filters, signal, priority, cacheTtl: force ? null : MINUTE})
		);

	const fetchLeaderboardPage = async (leaderboardId, page = 1, filters = {}, priority = PRIORITY.FG_LOW, signal = null, force = false) =>
		resolvePromiseOrWaitForPending(`apiClient/leaderboard/${leaderboardId}/${page}/${stringify(filters)}`, () =>
			leaderboardApiClient.getProcessed({leaderboardId, page, filters, signal, priority, cacheTtl: force ? null : MINUTE})
		);

	const fetchAccSaberPage = async (leaderboardId, page = 1, priority = PRIORITY.FG_LOW, signal = null, force = false) => {
		if (page < 1) page = 1;

		const data = await resolvePromiseOrWaitForPending(`accSaberApiClient/leaderboard/${leaderboardId}/${page}`, () =>
			accSaberLeaderboardApiClient.getProcessed({
				leaderboardId,
				page,
				signal,
				priority,
				cacheTtl: ACCSABER_LEADERBOARD_NETWORK_TTL,
			})
		);

		if (!data || !data.scores) return data;

		const startIdx = (page - 1) * ACCSABER_LEADERBOARD_SCORES_PER_PAGE;
		if (data.scores.length < startIdx + 1) return data;

		return {
			...data,
			scores: data.scores.slice(startIdx, startIdx + ACCSABER_LEADERBOARD_SCORES_PER_PAGE),
		};
	};

	const fetchLeaderboardStats = async (leaderboardId, priority = PRIORITY.FG_LOW, {...options} = {cacheTtl: HOUR, maxAge: HOUR}) =>
		statsApiClient.getProcessed({...options, leaderboardId, priority});

	const destroyService = () => {
		service = null;
	};

	service = {
		fetchAllLeaderboardsPage,
		fetchLeaderboardPage,
		fetchAccSaberPage,
		fetchLeaderboardStats,
		LEADERBOARD_SCORES_PER_PAGE,
		destroyService,
	};

	return service;
};
