import rankedsRepository from "../db/repository/rankeds";
import keyValueRepository from "../db/repository/key-value";
import rankedsChangesRepository from "../db/repository/rankeds-changes";
import {convertArrayToObjectByKey} from '../utils/js'

export const storeRanked = async ranked => rankedsRepository().set(ranked);
export const storeRankeds = async rankeds => Promise.all(rankeds.map(async ranked => storeRanked(ranked)));
export const getRankedSongs = async () => convertArrayToObjectByKey(await rankedsRepository().getAll() ?? {}, 'leaderboardId');
export const getRankedSongsLastUpdated = async () => keyValueRepository().get('rankedSongsLastUpdated');
export const setRankedSongsLastUpdated = async date => keyValueRepository().set(date,'rankedSongsLastUpdated');
export const getRankedsChangesSince = async (sinceTimestamp, upToTimestamp = null) => {
    const changes = await rankedsChangesRepository().getAllFromIndex('rankeds-changes-timestamp', upToTimestamp ? IDBKeyRange.bound(sinceTimestamp, upToTimestamp) : IDBKeyRange.lowerBound(sinceTimestamp));
    if (!changes || !changes.length) return {};

    // return all song changes for matched timestamps {leaderboardId: [{change1}, {change2}...]}
    return changes.reduce((cum, change) => {
        cum[change.leaderboardId] = cum[change.leaderboardId] ?? [];
        cum[change.leaderboardId].push(change);

        return cum;
    }, {});
}
export const storeRankedsChanges = async rankedsChanges => Promise.all(rankedsChanges.map(async rc => rankedsChangesRepository().set(rc)));

// errors in API
export const UNRANKED = [97223, 20506, 102179, 102180];
export const RANKED = [];
