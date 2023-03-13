import createRankingService from '../../../services/beatleader/ranking-event';
import queue from '../../../network/queues/queues';

let rankingService = null;

export default () => {
	if (!rankingService) rankingService = createRankingService();

	const getProcessed = async ({
		type = 'global',
		page = 1,
		eventId = 1,
		filters = {},
		priority = queue.PRIORITY.FG_HIGH,
		signal = null,
		force = false,
	} = {}) => {
		page = parseInt(page, 10);
		if (isNaN(page)) page = 1;

		let data = null;
		switch (type) {
			case 'followed':
				data = await rankingService.getFollowed(page, eventId, filters, priority, signal, force);
				break;

			default:
				data = await rankingService.getGlobal(page, eventId, filters, priority, signal, force);
		}

		return {total: data?.metadata?.total ?? null, data: data?.data ?? []};
	};

	return {
		getProcessed,
		getCached: async () => null,
	};
};
