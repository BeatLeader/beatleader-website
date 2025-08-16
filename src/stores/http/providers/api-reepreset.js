import createPresetService from '../../../services/beatleader/reepresets';
import queue from '../../../network/queues/queues';

let presetService = null;

export default () => {
	if (!presetService) presetService = createPresetService();

	const getProcessed = async ({clanId, page = 1, filters = {}, priority = queue.PRIORITY.FG_HIGH, signal = null, force = false} = {}) =>
		presetService.fetchPresetPage(clanId, page, filters, priority, signal, force);

	return {
		getProcessed,
		getCached: getProcessed,
	};
};
