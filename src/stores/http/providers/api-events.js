import apiEventsClient from '../../../network/clients/beatleader/events/api-events';
import queue from '../../../network/queues/queues';

export default () => {
	const getProcessed = async ({page = 1, filters = {}, priority = queue.PRIORITY.FG_HIGH, signal = null, force = false} = {}) =>
		apiEventsClient.getProcessed({page, filters, priority, signal, force});

	return {
		getProcessed,
		getCached: getProcessed,
	};
};
