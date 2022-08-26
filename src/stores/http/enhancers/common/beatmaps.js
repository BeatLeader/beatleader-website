import createBeatMapsService from '../../../../services/beatmaps';
import {opt} from '../../../../utils/js';

const beatMaps = createBeatMapsService();

export default async (data, cachedOnly = false) => {
	if (!opt(data, 'leaderboard.song.hash.length')) return;

	data.leaderboard.beatMaps = await beatMaps.byHash(data.leaderboard.song.hash, false, cachedOnly);
};
