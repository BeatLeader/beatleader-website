import {writable} from 'svelte/store';
import {diffForDiffName} from '../../utils/beatleader/format';

let store = null;
let storeSubCount = 0;

export default () => {
	storeSubCount++;
	if (store) return store;

	let starRatings = {};

	const get = () => starRatings;
	const {subscribe: subscribeState, set} = writable(starRatings);

	const fetchExMachina = async (hash, link, diff, mode, scale = 1) => {
		if (!hash || !diff || !mode) return;
		fetch(`https://stage.api.beatleader.net/json/${hash.length >= 40 ? hash : "link"}/${mode}/${diffForDiffName(diff)}/full/time-scale/${scale}${hash.length >= 40 ? "" : "?link="+link}`)
			.then(async response => {
				if (response.status == 200) {
					const data = await response.json();

					starRatings[hash + diff + mode + scale] = data;
					set(starRatings);
				} else {
					starRatings[hash + diff + mode + scale] = undefined;
					set(starRatings);
				}
			})
			.catch(err => null);
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

	return {
		subscribe,
		get,
		fetchExMachina,
	};
};
