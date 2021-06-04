import beatSaverService from '../../../../services/beatsaver'
import {opt} from '../../../../utils/js'

const beatSaver = beatSaverService();

export default async (data) => {
    if (!opt(data, 'leaderboard.song.hash.length')) return data;

    // here live dragons! doesn't work without intermediate variable
    const beatSaverData = await beatSaver.byHash(data.leaderboard.song.hash);
    data.leaderboard.beatSaver = beatSaverData;

    return data;
}