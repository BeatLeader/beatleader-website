import {opt} from '../../../../utils/js'

export default async (data) => {
    const leaderboardId = opt(data, 'leaderboard.leaderboardId');
    if (!leaderboardId) return null;

    // TODO: test only
    data.leaderboard.stars = Math.random() * 14;

    return data;
}