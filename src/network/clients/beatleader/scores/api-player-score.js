import queue from '../../../queues/queues';
import createClient from '../../generic';
import {processLeaderboardScore} from '../leaderboard/utils/process';

const process = response => {
	try {
		return processLeaderboardScore(response);
	} catch (err) {
		console.error(err);
		return null;
	}
};

const get = async ({playerId, hash, diff, type, priority = queue.PRIORITY.FG_HIGH, ...queueOptions} = {}) =>
	queue.BEATLEADER_API.playerScore(playerId, hash, diff, type, priority, queueOptions);

const client = createClient(get, process);

export default client;
