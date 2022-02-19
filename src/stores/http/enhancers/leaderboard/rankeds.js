import createRankedsStore from '../../../beatleader/rankeds'
import {opt} from '../../../../utils/js'

let rankeds;

export default async (data) => {
    if (rankeds === undefined) {
        rankeds = (await createRankedsStore()).get();
    }

    if (!rankeds) return;

    const leaderboardId = opt(data, 'leaderboard.leaderboardId');
    if (!leaderboardId) return;

    data.leaderboard.stars = rankeds[leaderboardId] && rankeds[leaderboardId].stars ? rankeds[leaderboardId].stars : null;
}