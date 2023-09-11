import {writable} from 'svelte/store';
import createScoresFetcher from '../http/providers/utils/scores-fetch';
import {processScore} from '../../network/clients/beatleader/scores/utils/processScore';

let store = null;
let storeSubCount = 0;
let scoresFetcher = null;
export default () => {
	if (!scoresFetcher) scoresFetcher = createScoresFetcher();

	storeSubCount++;
	if (store) return store;

	let pinnedScores = {};

	const get = () => pinnedScores;
	const {subscribe: subscribeState, set} = writable(pinnedScores);

	const fetchScores = async id => {
		if (!id) return;
		scoresFetcher.fetchPinnedScores(id).then(data => {
			pinnedScores[id] = data;
			set(pinnedScores);
		});
	};

	const update = fn => set(fn(pinnedScores));

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
		update,
		fetchScores,
	};

	return store;
};
