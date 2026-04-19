import {writable} from 'svelte/store';
import {BL_API_URL} from '../../network/queues/beatleader/api-queue';
import makePendingPromisePool from '../../utils/pending-promises';

const resolvePromiseOrWaitForPending = makePendingPromisePool();
const {subscribe, set} = writable(null);

let cachedPrestigeDescriptions = null;

const fetchPrestigeDescriptions = async () => {
	if (cachedPrestigeDescriptions) return cachedPrestigeDescriptions;

	return resolvePromiseOrWaitForPending('experience/levels', () =>
		fetch(BL_API_URL + 'experience/levels')
			.then(response => response.json())
			.then(data => {
				cachedPrestigeDescriptions = data;
				set(cachedPrestigeDescriptions);

				return cachedPrestigeDescriptions;
			})
			.catch(error => {
				console.error('Error fetching prestige descriptions:', error);
				throw error;
			})
	);
};

export default {
	subscribe(run, invalidate) {
		fetchPrestigeDescriptions().catch(() => {});
		return subscribe(run, invalidate);
	},
	fetch: fetchPrestigeDescriptions,
};
