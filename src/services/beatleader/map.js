import mapsApiClient from '../../network/clients/beatleader/leaderboard/api-maps';
import makePendingPromisePool from '../../utils/pending-promises';
import {PRIORITY} from '../../network/queues/http-queue';
import {MINUTE, HOUR} from '../../utils/date';

let service = null;
export default () => {
	if (service) return service;

	const resolvePromiseOrWaitForPending = makePendingPromisePool();

	const fetchAllMapsPage = async (page = 1, type = 'ranked', filters = {}, priority = PRIORITY.FG_LOW, signal = null, force = false) =>
		resolvePromiseOrWaitForPending(`apiClient/maps/${type}/${page}`, () =>
			mapsApiClient.getProcessed({page, type, filters, signal, priority, cacheTtl: force ? null : MINUTE})
		);

	const destroyService = () => {
		service = null;
	};

	service = {
		fetchAllMapsPage,
		destroyService,
	};

	return service;
};
