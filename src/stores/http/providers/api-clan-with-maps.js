import createClanService from '../../../services/beatleader/clan';
import queue from '../../../network/queues/queues';

let clanService = null;

export default () => {
	if (!clanService) clanService = createClanService();

	const getProcessed = async ({clanId, page = 1, filters = {}, priority = queue.PRIORITY.FG_HIGH, signal = null, force = false} = {}) =>
					clanService.fetchClanPageWithMaps(clanId, page, filters, priority, signal, force);

	return {
		getProcessed,
		getCached: getProcessed,
	};
};
