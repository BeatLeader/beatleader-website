import queue from '../../../queues/queues';
import createClient from '../../generic';

const process = response => {
	if (!Array.isArray(response)) return null;

	return response
		.map(m => {
			const timeset = parseInt(m?.timepost > 0 ? m.timepost : m?.timeset, 10);
			if (isNaN(timeset)) return null;

			return {
				...m,
				acc: Number.isFinite(m?.ratio) ? m.ratio * 100 : 0,
				timeset: new Date(timeset * 1000),
			};
		})
		.filter(m => m);
};

const get = async ({playerId, priority = queue.PRIORITY.FG_HIGH, ...queueOptions} = {}) =>
	queue.BEATLEADER_API.rankGraph(playerId, priority, queueOptions);

const client = createClient(get, process);

export default client;
