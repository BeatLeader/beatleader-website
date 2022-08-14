import queue from '../../../queues/queues';
import createClient from '../../generic';
import {processLeaderboardScore as processLegacyLeaderboardScore} from '../../../queues/beatleader/api-queue';
import {processLeaderboardScore} from '../leaderboard/utils/process';

const process = response => {
	try {
		const legacyProcessed = processLegacyLeaderboardScore(response);
		if (!legacyProcessed) return null;

		return processLeaderboardScore(legacyProcessed);
	} catch (err) {
		console.error(err);
		return null;
	}
};

const get = async ({playerId, hash, diff, type, priority = queue.PRIORITY.FG_HIGH, ...queueOptions} = {}) =>
	queue.BEATLEADER_API.playerScore(playerId, hash, diff, type, priority, queueOptions);

const client = createClient(get, process);

export default client;
