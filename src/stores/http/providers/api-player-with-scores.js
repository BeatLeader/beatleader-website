import createPlayerService from '../../../services/beatleader/player';
import createScoresFetcher from './utils/scores-fetch';
import queue from '../../../network/queues/queues';
import {MINUTE, SECOND} from '../../../utils/date';
import makePendingPromisePool from '../../../utils/pending-promises';

let playerService = null;
let scoresFetcher = null;

export default () => {
	playerService = createPlayerService();
	scoresFetcher = createScoresFetcher();

	let firstFetch = true;

	const resolvePromiseOrWaitForPending = makePendingPromisePool();
	const fetchPlayerAndScores = async (params = {}) =>
		resolvePromiseOrWaitForPending(`playerWithScores/${params?.playerId}/${params?.service}/${JSON.stringify(params?.serviceParams)}`, () =>
			fetchPlayerAndScoresInternal(params)
		);

	const fetchPlayerAndScoresInternal = async ({
		playerId,
		priority = queue.PRIORITY.FG_HIGH,
		service = 'scores',
		serviceParams = {sort: 'date', order: 'desc', page: 1},
		signal = null,
		force = false,
	} = {}) => {
		const refreshInterval = firstFetch ? 10 * SECOND : MINUTE;
		const effectiveForce = force && !firstFetch;
		firstFetch = false;

		const scoresPromise = async () => {
			try {
				return await scoresFetcher.fetchLiveScores(playerId, service, serviceParams, {
					refreshInterval,
					priority,
					signal,
					force: effectiveForce,
				});
			} catch {
				return [];
			}
		};

		const data = await Promise.all([
			playerService.fetchHydratedPlayer(playerId, refreshInterval, priority, signal, effectiveForce),
			scoresPromise(),
		]);

		return {...data[0], scores: data[1], service, serviceParams};
	};
	return {
		getProcessed: fetchPlayerAndScores,
		getCached: fetchPlayerAndScores,

		destroy() {
			playerService.destroyService();
		},
	};
};
