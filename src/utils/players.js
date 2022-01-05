import playersRepository from "../db/repository/players";
import playersHistoryRepository from "../db/repository/players-history";
import scoresRepository from "../db/repository/scores";
import groupsRepository from "../db/repository/groups";
import {getRankedsChangesSince, getRankedSongs} from "./rankeds";
import {substituteVars} from "../utils/format";
import {dateFromString} from "../utils/date";
import {arrayUnique, convertArrayToObjectByKey} from "../utils/js";
import {configStore} from '../stores/config'

const NEW_SCORESABER_URL = 'https://new.scoresaber.com';
const PLAYER_PROFILE_URL = NEW_SCORESABER_URL + '/u/${playerId}';
const PLAYS_PER_PAGE = 8; // top/recent plays

export const isCountryPlayer = (u, country) => u && u.id && !!u.ssplCountryRank && !!u.ssplCountryRank[country] && ((country && u.country.toLowerCase() === country.toLowerCase()));

export const getActiveCountryPlayers = async (country, withMain = true) => {
    const players = await getPlayers() ?? {};
    const mainPlayerId = withMain ? await configStore.getMainPlayerId() : null;
    return players.filter(p => (p && p.id && mainPlayerId && p.id === mainPlayerId) || isCountryPlayer(p, country))
}
export const getActiveCountryPlayersIds = async (country, withMain = true) => (await getActiveCountryPlayers(country, withMain)).filter(p => !!p.id).map(p => p.id);

export const filterPlayersByIdsList = (playerIds, players) => players.filter(player => playerIds.includes(player.id));

export const getAllPlayersRanking = async country => {
    const players = await getAllActivePlayers(country);
    return players ? Object.values(players).filter(player => player.name).sort((a,b) => b.pp - a.pp) : null;
}

export const getCountryRanking = async (country) => {
    const players = await getActiveCountryPlayers(country);
    return players ? players.sort((a,b) => b.pp - a.pp).slice(0, 50) : null;
}

export const isDataAvailable = async () => (await getPlayers()).length > 0;

export const updatePlayer = async playerInfo => playersRepository().set(playerInfo);
export const getPlayers = async () => playersRepository().getAll();
export const getPlayerInfo = async (playerId) => await playersRepository().get(playerId) ?? null;
export const getPlayerHistory = async playerId => await playersHistoryRepository().getAllFromIndex('players-history-playerId', playerId) ?? null;
export const getAllPlayersHistory = async (sinceDate, toDate) => await playersHistoryRepository().getAllFromIndex('players-history-timestamp', IDBKeyRange.bound(sinceDate, toDate)) ?? [];
export const getPlayerInfoFromPlayers = (players, playerId) => players?.[playerId] ? players[playerId] : null;

export const getPlayerLastUpdated = async playerId => (await getPlayerInfo(playerId))?.lastUpdated ?? null;
export const getPlayerProfileLastUpdated = async playerId => (await getPlayerInfo(playerId))?.profileLastUpdated ?? null;

export const removeAllPlayerData = async playerId => {
    const playerHistory = await playersHistoryRepository().getAllFromIndex('players-history-playerId', playerId);
    const playerScores = await scoresRepository().getAllFromIndex('scores-playerId', playerId);

    await Promise.all(
      []
        .concat(playerHistory.map(ph => playersHistoryRepository().deleteObject(ph)))
        .concat(playerScores.map(s => scoresRepository().deleteObject(s)))
        .concat([playersRepository().delete(playerId)])
    );
};

export const getPlayerGroups = async (groupName) => {
    const groups = await groupsRepository().getAllFromIndex('groups-name', groupName);

    return groups && groups.length
      ? Object.values(
        groups.reduce((cum, playerGroup) => {
            if (!cum[playerGroup.name]) cum[playerGroup.name] = {name: playerGroup.name, players: []};

            cum[playerGroup.name].players.push(playerGroup.playerId);

            return cum;
        }, {}),
      )
      : null;
};

export const addPlayerToGroup = async (playerId, groupName = 'Default') => {
    const isPlayerAlreadyAdded = (await groupsRepository().getAllFromIndex('groups-name', groupName, true))
      .some(g => g.playerId === playerId);
    if (isPlayerAlreadyAdded) return;

    return groupsRepository().set({name: groupName, playerId});
}

export const removePlayerFromGroup = async (playerId, removeData = true, groupName = 'Default') => {
    const playerGroups = await groupsRepository().getAllFromIndex('groups-playerId', playerId, true);

    const playerGroupsToRemove = playerGroups.filter(pg => !groupName || pg.name === groupName);

    await Promise.all(playerGroupsToRemove.map(async pg => groupsRepository().deleteObject(pg)));

    if (!removeData || playerGroups.length > playerGroupsToRemove.length) return;

    await removeAllPlayerData(playerId);
}

export const getFriendsIds = async (withMain = false) => {
    const groups = await getPlayerGroups(undefined) ?? [];

    return arrayUnique(
      groups
        .reduce((cum, group) => cum.concat(group.players), [])
        .concat(withMain ? [await configStore.getMainPlayerId()] : [])
        .filter(playerId => playerId)
    );
}

export const getFriends = async (country, withMain = false) => filterPlayersByIdsList(await getFriendsIds(withMain), await getPlayers());

export const getManuallyAddedPlayersIds = async (country, withMain = false) => {
    const friendsIds = await getFriendsIds(withMain);

    const players = convertArrayToObjectByKey(await getPlayers(), 'id');

    return friendsIds.filter(playerId => !isCountryPlayer(players?.[playerId] ?? null, country));
}

export const getManuallyAddedPlayers = async (country, withMain = false) => filterPlayersByIdsList(await getManuallyAddedPlayersIds(country, withMain), await getPlayers());

export const getAllActivePlayersIds = async (country) => arrayUnique((await getActiveCountryPlayersIds(country, true)).concat(await getManuallyAddedPlayersIds(country, false)));

export const getAllActivePlayers = async (country) => {
    return await filterPlayersByIdsList(await getAllActivePlayersIds(country), await getPlayers());
}

export const getPlayerProfileUrl = (playerId, recentPlaysPage = false, transform = false, page = 1) => substituteVars(
  `${PLAYER_PROFILE_URL}?page=${page}&${recentPlaysPage ? 'sort=2' : 'sort=1'}${transform ? '&transform=true' : ''}`,
  {playerId}
)

export const getPlayerAvatarUrl = async playerId => {
    if (!playerId) return null;

    const playerInfo = await getPlayerInfo(playerId);
    return playerInfo && playerInfo.avatar ? (playerInfo.avatar.startsWith('http') ? playerInfo.avatar : NEW_SCORESABER_URL + playerInfo.avatar) : null;
}

export const getPlayerScores = player => player?.scores ? player.scores : null;

export const getAllScores = async () => scoresRepository().getAll();
export const getScoresByPlayerId = async (playerId) => scoresRepository().getAllFromIndex('scores-playerId', playerId);
export const isPlayerDataAvailable = async (playerId) => !!(await scoresRepository().getFromIndex('scores-playerId', playerId));
export const isAnyPlayerDataAvailable = async () => !!(await scoresRepository().getFromIndex('scores-playerId', ''));
export const getAllScoresSince = async (sinceDate) => { 
    return scoresRepository().getAllFromIndex('scores-timeSet', sinceDate ? IDBKeyRange.lowerBound(sinceDate) : undefined)
};
export const getAllScoresWithPpOver = async (minPp) => scoresRepository().getAllFromIndex('scores-pp', minPp ? IDBKeyRange.lowerBound(minPp) : undefined);

export const getRankedScoresByPlayerId = async (playerId) => {
    const scores = await getScoresByPlayerId(playerId);
    const rankedMaps = await getRankedSongs();
    return scores
        ? Object.values(scores)
            .filter(s => s.pp > 0)
            .filter(s => rankedMaps?.[s.leaderboardId])
        : [];
}

export const getPlayerSongScore = async (player, leaderboardId) => getSongScoreByPlayerId(player?.id + '_' + leaderboardId);
export const getSongScoreByPlayerId = async (playerId, leaderboardId) => scoresRepository().get(playerId + '_' + leaderboardId);
export const updateSongScore = async score => scoresRepository().set(score);

export const getPlayerSongScoreHistory = async (playerScore) => {
    if (!playerScore || !playerScore.history) return null;

    return playerScore.history
        .filter(h => h.score && h.score !== playerScore.score)
        .sort((a, b) => b.score - a.score)
        .map(h => ({...h, timeset: new Date(h.timestamp)}));
}

const getPlayerRankedsToUpdate = async (scores, previousLastUpdated) => {
    if (!previousLastUpdated) return [];

    const songsChangedAfterPreviousUpdate = await getRankedsChangesSince(previousLastUpdated.getTime());

    // check all song changed after previous update
    return Object.keys(songsChangedAfterPreviousUpdate).reduce((cum, leaderboardId) => {
        // skip if the player didn't play the song
        if (!scores[leaderboardId]) return cum;

        const songLastPlay = scores[leaderboardId]?.timeset;

        // skip if song was played AFTER previous update (because all new scores were downloaded with current update, changed or not)
        if (songLastPlay && songLastPlay > previousLastUpdated) return cum;

        // mark song to update
        cum.push(parseInt(leaderboardId, 10));

        return cum;
    }, [])
}

export const getPlayerScorePagesToUpdate = (allScores, leaderboardIdsToUpdate, includeAllLeaderboardIdsOnPage = false) => {
    const sortedScores = Object.values(allScores)
      .map((s) => ({
          leaderboardId: s.leaderboardId,
          timeset      : dateFromString(s.timeset)
      }))
      .sort((a, b) => b.timeset - a.timeset);

    return sortedScores
      .reduce((cum, s, idx) => {
          if (leaderboardIdsToUpdate.includes(s.leaderboardId)) {
              const page = Math.floor(idx / PLAYS_PER_PAGE) + 1;

              if (includeAllLeaderboardIdsOnPage) {
                  if (!cum[page]) cum[page] = {searched: [], all: []};

                  cum[page].searched = cum[page].searched.concat([s.leaderboardId]);

                  cum[page].all = arrayUnique(
                    cum[page].all.concat(
                      sortedScores
                        .slice((page - 1) * PLAYS_PER_PAGE, page * PLAYS_PER_PAGE)
                        .map(s => s.leaderboardId)
                    )
                  );
              } else {
                  cum[page] = (cum[page] ?? []).concat([s.leaderboardId]);
              }
          }
          return cum;
      }, {});
}

export const getPlayerRankedsScorePagesToUpdate = async (scores, previousLastUpdated, additionalLeaderboardsToUpdate = []) => {
    const songsToUpdate = await getPlayerRankedsToUpdate(scores, previousLastUpdated);
    if (!songsToUpdate.length && !additionalLeaderboardsToUpdate.length) return {};

    return getPlayerScorePagesToUpdate(scores, songsToUpdate.concat(additionalLeaderboardsToUpdate));
}