import createScoresFetcher from './utils/scores-fetch';
import queue from '../../../network/queues/queues';
import {MINUTE} from '../../../utils/date';

let scoresFetcher = null;

export default () => {
	scoresFetcher = createScoresFetcher();

	const getProcessed = async ({
		playerId,
		service = 'beatleader',
		serviceParams = {sort: 'date', order: 'desc', page: 1},
		priority = queue.PRIORITY.FG_HIGH,
		signal = null,
		force = false,
	} = {}) => {
		if (playerId === 'user-friends') {
			return scoresFetcher.fetchLiveScores(null, playerId, serviceParams, {refreshInterval: MINUTE, priority, signal, force});
		}

		return scoresFetcher.fetchLiveScores(playerId, service, serviceParams, {refreshInterval: MINUTE, priority, signal, force});
	};

	return {
		getProcessed,
		getCached: getProcessed,
	};
};
