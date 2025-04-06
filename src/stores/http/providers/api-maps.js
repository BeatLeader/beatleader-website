import createMapService from '../../../services/beatleader/map';
import queue from '../../../network/queues/queues';

let mapService = null;

export default () => {
	if (!mapService) mapService = createMapService();

	const getProcessed = async ({
		page = 1,
		type = 'ranked',
		filters = {},
		priority = queue.PRIORITY.FG_HIGH,
		signal = null,
		force = false,
	} = {}) => mapService.fetchAllMapsPage(page, type, filters, priority, signal, force);

	return {
		getProcessed,
		getCached: getProcessed,
	};
};
