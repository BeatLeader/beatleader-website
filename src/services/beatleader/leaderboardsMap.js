import leaderboardsApiClient from '../../network/clients/beatleader/leaderboard/api-leaderboards-hash';
import {PRIORITY} from '../../network/queues/http-queue';
import keyValueRepository from '../../db/repository/key-value';

export default () => {
	const byHash = async (hash, forceUpdate = false, cacheOnly = false, signal = null, priority = PRIORITY.FG_LOW) => {
		hash = hash.toLowerCase();

		var mapperInfo = await keyValueRepository().get('leaderboards-' + hash);
		if (!cacheOnly && (forceUpdate || !mapperInfo)) {
			mapperInfo = await leaderboardsApiClient.getProcessed({hash, my_scores: false, signal, priority});
			keyValueRepository().set(mapperInfo, 'leaderboards-' + hash);
		}

		return mapperInfo;
	};

	const byHashWithScore = async (hash, forceUpdate = false, cacheOnly = false, signal = null, priority = PRIORITY.FG_LOW) => {
		hash = hash.toLowerCase();

		var mapperInfo = await keyValueRepository().get('leaderboards-score-' + hash);
		var cached = true;
		if (!cacheOnly && (forceUpdate || !mapperInfo)) {
			mapperInfo = await leaderboardsApiClient.getProcessed({hash, my_scores: true, signal, priority});
			keyValueRepository().set(mapperInfo, 'leaderboards-score-' + hash);
			cached = false;
		}

		return {info: mapperInfo, cached};
	};

	return {
		byHash,
		byHashWithScore,
	};
};
