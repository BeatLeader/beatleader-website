import createScoresFetcher from './utils/scores-fetch';
import queue from '../../../network/queues/queues';
import {MINUTE} from '../../../utils/date';
import {SPECIAL_PLAYER_ID, ALL_SCORES_PLAYER_ID} from '../../../network/queues/beatleader/api-queue';

let scoresFetcher = null;

export default () => {
	scoresFetcher = createScoresFetcher();

	const getProcessed = async ({
		playerId,
		service = 'scores',
		serviceParams = {sort: 'date', order: 'desc', page: 1},
		priority = queue.PRIORITY.FG_HIGH,
		signal = null,
		force = false,
	} = {}) => {
		if (playerId === SPECIAL_PLAYER_ID || playerId === ALL_SCORES_PLAYER_ID) {
			return scoresFetcher.fetchLiveScores(null, playerId, serviceParams, {refreshInterval: MINUTE, priority, signal, force});
		}

		return scoresFetcher.fetchLiveScores(playerId, service, serviceParams, {refreshInterval: MINUTE, priority, signal, force});
	};

	return {
		getProcessed,
		getCached: getProcessed,
	};
};
