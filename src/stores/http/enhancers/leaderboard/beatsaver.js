import beatSaverService from '../../../../services/beatsaver'
import {opt} from '../../../../utils/js'

const beatSaver = beatSaverService();

export default async (data) => {
    if (!opt(data, 'leaderboard.song.hash.length')) return;

    data.leaderboard.beatSaver = await beatSaver.byHash(data.leaderboard.song.hash);
}