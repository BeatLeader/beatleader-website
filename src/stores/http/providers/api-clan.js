import createClanService from '../../../services/beatleader/clan';
import queue from '../../../network/queues/queues';

let clanService = null;

export default () => {
	if (!clanService) clanService = createClanService();

	// TODO: REVERT BEFORE PROD
	// const getProcessed = async ({clanId, page = 1, filters = {}, priority = queue.PRIORITY.FG_HIGH, signal = null, force = false} = {}) =>
	// clanService.fetchClanPage(clanId, page, filters, priority, signal, force);
	const getProcessed = async ({
		clanId,
		type = '',
		page = 1,
		filters = {},
		priority = queue.PRIORITY.FG_HIGH,
		signal = null,
		force = false,
	} = {}) => {
		switch (type) {
			case 'players':
				return await clanService.fetchClanPage(clanId, type, page, filters, priority, signal, force);
			case 'capturedLeaderboards':
				return await clanService.fetchClanPage(clanId, type, page, {capturedleaderboards: true}, priority, signal, force);
		}
	};

	return {
		getProcessed,
		getCached: getProcessed,
	};
};
