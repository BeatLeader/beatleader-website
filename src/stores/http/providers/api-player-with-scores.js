import createPlayerService from '../../../services/beatleader/player';
import createScoresFetcher from './utils/scores-fetch';
import queue from '../../../network/queues/queues';
import {MINUTE, SECOND} from '../../../utils/date';

let playerService = null;
let scoresFetcher = null;

export default () => {
	playerService = createPlayerService();
	scoresFetcher = createScoresFetcher();

	let firstFetch = true;

	const fetchPlayerAndScores = async ({
		playerId,
		priority = queue.PRIORITY.FG_HIGH,
		service = 'beatleader',
		serviceParams = {sort: 'date', order: 'desc', page: 1},
		signal = null,
		force = false,
	} = {}) => {
		const refreshInterval = firstFetch ? 5 * SECOND : MINUTE;
		firstFetch = false;

		const data = await Promise.all([playerService.fetchPlayerOrGetFromCache(playerId, refreshInterval, priority, signal, force)]);

		return {...data[0], scores: [], service, serviceParams};
	};
	return {
		getProcessed: fetchPlayerAndScores,
		getCached: fetchPlayerAndScores,

		destroy() {
			playerService.destroyService();
		},
	};
};
