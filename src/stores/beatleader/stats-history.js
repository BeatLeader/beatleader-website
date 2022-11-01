import {writable} from 'svelte/store';
import {BL_API_URL} from '../../network/queues/beatleader/api-queue';

let store = null;
let storeSubCount = 0;

export default () => {
	storeSubCount++;
	if (store) return store;

	let votingStatuses = {};

	const get = () => votingStatuses;
	const {subscribe: subscribeState, set} = writable(votingStatuses);

	const fetchStats = async id => {
		if (!id) return;
		fetch(BL_API_URL + `player/${id}/history`)
			.then(response => response.json())
			.then(data => {
				var processedStatsHistory = data ?? [];

				if (processedStatsHistory.length) {
					Object.keys(processedStatsHistory[0]).forEach(key => {
						processedStatsHistory[key] = [];
						processedStatsHistory.reverse().forEach(element => {
							processedStatsHistory[key].push(element[key]);
						});
					});
				}

				['totalPlayCount', 'rankedPlayCount'].forEach(key => {
					if (!processedStatsHistory || !processedStatsHistory[key]) return;

					processedStatsHistory[`${key}Daily`] = processedStatsHistory[key].reduce((cum, item) => {
						const prev = cum.length ? processedStatsHistory[key][cum.length - 1] : 0;

						let value = item ? item - (prev ?? 0) : 0;
						if ((value && value < 0) || !cum.length) value = 0;

						cum.push(value);

						return cum;
					}, []);
				});

				if (processedStatsHistory && processedStatsHistory.totalPlayCountDaily && processedStatsHistory.rankedPlayCountDaily) {
					processedStatsHistory.unrankedPlayCountDaily = processedStatsHistory.totalPlayCountDaily.map((value, idx) => {
						if (value === null) return null;

						let unranked = value - (processedStatsHistory.rankedPlayCountDaily[idx] ?? 0);
						if (unranked < 0) unranked = 0;

						return unranked;
					});
				}

				votingStatuses[id] = processedStatsHistory;
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
		fetchStats,
	};

	return store;
};
