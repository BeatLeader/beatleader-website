import createScoresService from './scores';
import makePendingPromisePool from '../../utils/pending-promises';
import {getTotalPpFromSortedPps} from '../../utils/beatleader/pp';

let service = null;
let serviceCreationCount = 0;
export default () => {
	serviceCreationCount++;
	if (service) return service;

	const scoresService = createScoresService();

	const resolvePromiseOrWaitForPending = makePendingPromisePool();

	const getTotalPp = scores =>
		scores && Array.isArray(scores)
			? getTotalPpFromSortedPps(
					scores
						.filter(s => s.pp > 0)
						.map(s => s.pp)
						.sort((a, b) => b - a)
			  )
			: null;

	const getTotalPlayerPp = async (playerId, modifiedScores = {}) =>
		getTotalPp(
			Object.values({
				...modifiedScores,
			})
		);

	async function getWhatIfScore(playerId, leaderboardId, pp = 0) {
		const currentTotalPp = await getTotalPlayerPp(playerId);
		if (!currentTotalPp) return null;

		const newTotalPp = await getTotalPlayerPp(playerId, {
			[leaderboardId]: {pp},
		});

		return {
			currentTotalPp,
			newTotalPp,
			diff: newTotalPp - currentTotalPp,
		};
	}

	// written by BaliBalo: https://github.com/BaliBalo/ScoreSaber/blob/master/pages/peepee.js
	const PP_PER_STAR = 42.114296;
	const ppCurve = [
		{at: 0, value: 0},
		{at: 45, value: 0.015},
		{at: 50, value: 0.03},
		{at: 55, value: 0.06},
		{at: 60, value: 0.105},
		{at: 65, value: 0.16},
		{at: 68, value: 0.24},
		{at: 70, value: 0.285},
		{at: 80, value: 0.563},
		{at: 84, value: 0.695},
		{at: 88, value: 0.826},
		{at: 94.5, value: 1.015},
		{at: 95, value: 1.046},
		{at: 100, value: 1.12},
		{at: 110, value: 1.18},
		{at: 114, value: 1.25},
	];
	function ppFactorFromAcc(acc) {
		if (!acc || acc <= 0) {
			return 0;
		}
		let index = ppCurve.findIndex(o => o.at >= acc);
		if (index === -1) {
			return ppCurve[ppCurve.length - 1].value;
		}
		if (!index) {
			return ppCurve[0].value;
		}
		let from = ppCurve[index - 1];
		let to = ppCurve[index];
		let progress = (acc - from.at) / (to.at - from.at);
		return from.value + (to.value - from.value) * progress;
	}

	function accFromPpFactor(ppFactor) {
		if (!ppFactor || ppFactor <= 0) return 0;

		const idx = ppCurve.findIndex(o => o.value >= ppFactor);
		if (idx < 0) return ppCurve[ppCurve.length - 1].at;

		const from = ppCurve[idx - 1];
		const to = ppCurve[idx];
		const progress = (ppFactor - from.value) / (to.value - from.value);

		return from.at + (to.at - from.at) * progress;
	}

	const destroyService = () => {
		serviceCreationCount--;

		if (serviceCreationCount === 0) {
			scoresService.destroyService();

			service = null;
		}
	};

	service = {
		getWhatIfScore,
		getTotalPlayerPp,
		getTotalPp,
		ppFactorFromAcc,
		accFromPpFactor,
		PP_PER_STAR,
		destroyService,
	};

	return service;
};
