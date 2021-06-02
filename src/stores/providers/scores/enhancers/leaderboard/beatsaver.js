import beatSaverService from '../../../../../services/beatsaver'
import {opt} from '../../../../../utils/js'

const beatSaver = beatSaverService();

export default async (data) => {
    if (!opt(data, 'leaderboard.song.hash.length')) return data;

    // here live the dragons! doesn't work without immediate variable
    const beatSaverData = await beatSaver.byHash(data.leaderboard.song.hash);
    data.leaderboard.beatSaver = beatSaverData;

    return data;
}