import queue from '../../../queues/queues';
import createClient from '../../generic';
import {processClanRankingScores} from './utils/process';

const get = async ({leaderboardId, clanRankingId, page = 1, priority = queue.PRIORITY.FG_HIGH, ...queueOptions} = {}) =>
	queue.BEATLEADER_API.clanRankingScores(leaderboardId, clanRankingId, page, priority, queueOptions);

const client = createClient(get, processClanRankingScores);

export default client;
