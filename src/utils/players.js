import playersRepository from "../db/repository/players";
import playersHistoryRepository from "../db/repository/players-history";
import scoresRepository from "../db/repository/scores";
import {substituteVars} from "../utils/format";
import {arrayUnique, convertArrayToObjectByKey} from "../utils/js";
import {configStore} from '../stores/config'

const NEW_SCORESABER_URL = '';
const PLAYER_PROFILE_URL = NEW_SCORESABER_URL + '/u/${playerId}';

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

export const getFriendsIds = async (withMain = false) => ([]);

export const getManuallyAddedPlayersIds = async (country, withMain = false) => {
    const friendsIds = await getFriendsIds(withMain);

    const players = convertArrayToObjectByKey(await getPlayers(), 'id');

    return friendsIds.filter(playerId => !isCountryPlayer(players?.[playerId] ?? null, country));
}

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

export const getPlayerSongScore = async (player, leaderboardId) => getSongScoreByPlayerId(player?.id + '_' + leaderboardId);
export const getSongScoreByPlayerId = async (playerId, leaderboardId) => scoresRepository().get(playerId + '_' + leaderboardId);
export const updateSongScore = async score => scoresRepository().set(score);