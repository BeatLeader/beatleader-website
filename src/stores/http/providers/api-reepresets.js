import createPresetsService from '../../../services/beatleader/reepresets';
import queue from '../../../network/queues/queues';

let clanService = null;

export default () => {
	if (!clanService) clanService = createPresetsService();

	const getProcessed = async ({page = 1, filters = {}, priority = queue.PRIORITY.FG_HIGH, signal = null, force = false} = {}) =>
		clanService.fetchPresetsPage(page, filters, priority, signal, force);

	return {
		getProcessed,
		getCached: getProcessed,
	};
};
