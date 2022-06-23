import playersRepository from "../db/repository/players";
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

export const getPlayerLastUpdated = async playerId => (await getPlayerInfo(playerId))?.lastUpdated ?? null;
export const getPlayerProfileLastUpdated = async playerId => (await getPlayerInfo(playerId))?.profileLastUpdated ?? null;

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