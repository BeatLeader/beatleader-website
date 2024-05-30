import {writable} from 'svelte/store';
import {BL_API_URL} from '../../network/queues/beatleader/api-queue';
import {toBlMidnight} from '../../utils/date';
import makePendingPromisePool from '../../utils/pending-promises';
import {GLOBAL_LEADERBOARD_TYPE} from '../../utils/format';

let store = null;
let storeSubCount = 0;

const resolvePromiseOrWaitForPending = makePendingPromisePool();

export default () => {
	storeSubCount++;
	if (store) return store;

	let votingStatuses = {};

	const get = () => votingStatuses;
	const {subscribe: subscribeState, set, update} = writable(votingStatuses);

	const fetchStats = async (playerData, count = 50) => {
		if (!playerData) return;

		return resolvePromiseOrWaitForPending(`player/${playerData.playerId}/history/${count}`, () =>
			fetch(BL_API_URL + `player/${playerData.playerId}/history/compact?count=${count}&leaderboardContext=${GLOBAL_LEADERBOARD_TYPE}`)
				.then(response => response.json())
				.then(data => {
					var processedStatsHistory = {};
					var statsHistory = data ?? [];

					if (statsHistory.length) {
						const reversedStatsHistory = statsHistory.reverse();
						Object.keys(statsHistory[0]).forEach(key => {
							processedStatsHistory[key] = [];
							reversedStatsHistory.forEach(element => {
								switch (key) {
									case 'averageAccuracy':
									case 'averageRankedAccuracy':
									case 'medianAccuracy':
									case 'medianRankedAccuracy':
									case 'topAccuracy':
										processedStatsHistory[key].push(element[key] * 100);
										break;

									default:
										processedStatsHistory[key].push(element[key]);
										break;
								}
							});
							const current = playerData.scoreStats[key] ?? playerData.playerInfo[key];
							if (current) {
								processedStatsHistory[key].push(current);
							}
						});
						processedStatsHistory['timestamp'].push(toBlMidnight(new Date()).getTime() / 1000 + 60 * 60 * 24);
						processedStatsHistory['countryRank'].push(playerData.playerInfo.countries[0].rank);
					}

					['totalPlayCount', 'rankedPlayCount', 'unrankedPlayCount', 'unrankedImprovementsCount', 'rankedImprovementsCount'].forEach(
						key => {
							if (!processedStatsHistory || !processedStatsHistory[key]) return;

							processedStatsHistory[`${key}Daily`] = processedStatsHistory[key].reduce((cum, item) => {
								const prev = cum.length ? processedStatsHistory[key][cum.length - 1] : 0;

								let value = item ? item - (prev ?? 0) : 0;
								if ((value && value < 0) || !cum.length) value = 0;

								cum.push(value);

								return cum;
							}, []);
						}
					);

					votingStatuses[playerData.playerId] = processedStatsHistory;
					set(votingStatuses);
				})
		);
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
		update,
		fetchStats,
	};

	return store;
};
