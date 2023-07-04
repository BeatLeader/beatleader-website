import {writable} from 'svelte/store';
import {BL_API_URL} from '../../network/queues/beatleader/api-queue';
import {processScore} from '../../network/clients/beatleader/scores/utils/processScore';

let store = null;
let storeSubCount = 0;

export default () => {
	storeSubCount++;
	if (store) return store;

	let votingStatuses = {};

	const get = () => votingStatuses;
	const {subscribe: subscribeState, set} = writable(votingStatuses);

	const fetchScores = async id => {
		if (!id) return;
		fetch(BL_API_URL + `player/${id}/pinnedScores`, {
			credentials: 'include',
		})
			.then(response => response.json())
			.then(data => {
				votingStatuses[id] = data?.map(s => processScore(s)) ?? [];
				set(votingStatuses);
			});
	};

	const subscribe = fn => {
		const stateUnsubscribe = subscribeState(fn);

		return () => {
			storeSubCount--;

			if (storeSubCount === 0) {
				store = null;

				stateUnsubscribe();
			}
		};
	};

	store = {
		subscribe,
		get,
		set,
		fetchScores,
	};

	return store;
};
