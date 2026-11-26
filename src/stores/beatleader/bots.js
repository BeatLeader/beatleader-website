import {writable} from 'svelte/store';
import {BL_API_URL} from '../../network/queues/beatleader/api-queue';
import makePendingPromisePool from '../../utils/pending-promises';

const resolvePromiseOrWaitForPending = makePendingPromisePool();
const {subscribe, set} = writable(null);

let cachedBots = null;

const fetchBots = async (force = false) => {
	if (cachedBots && !force) return cachedBots;

	return resolvePromiseOrWaitForPending('bots', () =>
		fetch(BL_API_URL + 'bots')
			.then(response => response.json())
			.then(data => {
				const bots = data?.bots ?? [];
				cachedBots = {
					defaultShownBots: data?.defaultShownBots ?? [],
					bots,
					byId: Object.fromEntries(bots.map(b => [b.id, b])),
				};
				set(cachedBots);

				return cachedBots;
			})
			.catch(error => {
				console.error('Error fetching bots:', error);
				throw error;
			})
	);
};

export default {
	subscribe(run, invalidate) {
		fetchBots().catch(() => {});
		return subscribe(run, invalidate);
	},
	fetch: fetchBots,
};

