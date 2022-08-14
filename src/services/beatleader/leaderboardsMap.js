import leaderboardsApiClient from '../../network/clients/beatleader/leaderboard/api-leaderboards-hash';
import {PRIORITY} from '../../network/queues/http-queue';
import keyValueRepository from '../../db/repository/key-value';

export default () => {
	const byHash = async (hash, forceUpdate = false, cacheOnly = false, signal = null, priority = PRIORITY.FG_LOW) => {
		hash = hash.toLowerCase();

		var mapperInfo = await keyValueRepository().get('leaderboards-' + hash);
		if (!cacheOnly && (forceUpdate || !mapperInfo)) {
			mapperInfo = await leaderboardsApiClient.getProcessed({hash, signal, priority});
			keyValueRepository().set(mapperInfo, 'leaderboards-' + hash);
		}

		return mapperInfo;
	};

	return {
		byHash,
	};
};
