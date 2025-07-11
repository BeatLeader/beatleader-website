import createScoresService from '../../../../services/beatleader/scores';
import createScoreAttemptsService from '../../../../services/beatleader/score-attempts';
import createAccSaberService from '../../../../services/accsaber';
import {capitalize} from '../../../../utils/js';
import {BL_API_URL, SPECIAL_PLAYER_ID, ALL_SCORES_PLAYER_ID} from '../../../../network/queues/beatleader/api-queue';
import {processScore} from '../../../../network/clients/beatleader/scores/utils/processScore';
import {fetchJson} from '../../../../network/fetch';
import {getResponseBody} from '../../../../network/queues/queues';
import makePendingPromisePool from '../../../../utils/pending-promises';
import {GLOBAL_LEADERBOARD_TYPE} from '../../../../utils/format';

let scoreFetcher = null;

let blScoresService = null;
let accSaberService = null;
let scoreAttemptsService = null;

const resolvePromiseOrWaitForPending = makePendingPromisePool();

export default () => {
	if (scoreFetcher) return scoreFetcher;

	blScoresService = createScoresService();
	scoreAttemptsService = createScoreAttemptsService();
	accSaberService = createAccSaberService();

	const processServiceParamsFilters = serviceParams => {
		if (!serviceParams) return serviceParams;

		const {filters: {stars = {}, ...restFilters} = {}, ...restParams} = serviceParams;

		return {
			...restParams,
			filters: {
				...restFilters,
				...Object.entries(stars ?? {}).reduce(
					(starFilter, [key, value]) => ({
						...starFilter,
						[`stars${capitalize(key)}`]: value,
					}),
					{}
				),
			},
		};
	};

	const fetchLiveScores = async (playerId, service, serviceParams = {sort: 'date', order: 'desc', page: 1}, otherParams = {}) => {
		const processedServiceParams = processServiceParamsFilters(serviceParams);

		switch (service) {
			case SPECIAL_PLAYER_ID:
				return blScoresService.fetchFollowedScores(
					processedServiceParams,
					otherParams?.refreshInterval,
					otherParams?.priority,
					otherParams?.signal,
					otherParams?.force
				);
			case ALL_SCORES_PLAYER_ID:
				return blScoresService.fetchAllScoresPage(
					processedServiceParams,
					otherParams?.refreshInterval,
					otherParams?.priority,
					otherParams?.signal,
					otherParams?.force
				);
			case 'accsaber':
				return accSaberService.getPlayerScoresPage(playerId, processedServiceParams);
			case 'attempts':
				return scoreAttemptsService.fetchScoresPageOrGetFromCache(
					playerId,
					processedServiceParams,
					otherParams?.refreshInterval,
					otherParams?.priority,
					otherParams?.signal,
					otherParams?.force
				);
			case 'scores':
			default:
				return blScoresService.fetchScoresPageOrGetFromCache(
					playerId,
					processedServiceParams,
					otherParams?.refreshInterval,
					otherParams?.priority,
					otherParams?.signal,
					otherParams?.force
				);
		}
	};

	const fetchPinnedScores = async id => {
		if (!id) return;

		return resolvePromiseOrWaitForPending(`pinnedScores/${id}`, () =>
			fetchJson(BL_API_URL + `player/${id}/pinnedScores?leaderboardContext=${GLOBAL_LEADERBOARD_TYPE}`).then(
				data => getResponseBody(data)?.map(s => processScore(s)) ?? []
			)
		);
	};

	scoreFetcher = {fetchCachedScores: fetchLiveScores, fetchLiveScores, fetchPinnedScores};

	return scoreFetcher;
};
