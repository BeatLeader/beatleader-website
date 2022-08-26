import queue from '../../queues/queues';
import createClient from '../generic';
import {dateFromString} from '../../../utils/date';

const process = response => {
	const playerId = response?.fetchOptions?.playerId ?? null;
	if (!response?.response || !Array.isArray(response.response) || !playerId) return [];

	return response.response.map(s => {
		let {
			songHash: hash,
			songName: name,
			songAuthorName: authorName,
			levelAuthorName,
			beatsaverKey,
			complexity,
			categoryDisplayName,
			difficulty,
			leaderboardId,
			accuracy: acc,
			ap,
			weightedAp,
			score,
			...originalScore
		} = s;

		if (acc && Number.isFinite(acc)) acc *= 100;
		leaderboardId = parseInt(leaderboardId, 10);
		if (isNaN(leaderboardId)) leaderboardId = null;

		const song = {hash, name, subName: '', authorName, levelAuthorName, beatsaverKey};
		const diffInfo = {type: 'Standard', diff: difficulty?.toLowerCase()?.replace('plus', 'Plus')};
		const leaderboard = {leaderboardId, song, diffInfo, complexity, categoryDisplayName};

		const timeSet = dateFromString(s.timeSet);
		return {
			id: `${playerId}-${s.leaderboardId}`,
			playerId,
			leaderboardId,
			timeSet,
			ap,
			acc,
			leaderboard,
			score: {...originalScore, ap, unmodifiedScore: score, score, mods: null, timeSet, acc, percentage: acc, weightedAp},
			fetchedAt: new Date(),
			lastUpdated: new Date(),
		};
	});
};

const get = async ({playerId, page = 1, priority = queue.PRIORITY.FG_HIGH, ...queueOptions} = {}) => {
	const response = await queue.ACCSABER.scores(playerId, page, priority, queueOptions);

	return {...response, body: {response: response.body, fetchOptions: {playerId, page}}};
};

const client = createClient(get, process);

export default client;
