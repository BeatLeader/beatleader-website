import createConfigStore from '../../../config'
import createScoresService from '../../../../services/scoresaber/scores'
import accEnhancer from './acc'
import beatSaviorEnhancer from './beatsavior'
import {opt} from '../../../../utils/js'

let scoresService = null;
let mainPlayerId = null;
let playerScores = {};

let configStoreUnsubscribe = null;

export const initCompareEnhancer = async () => {
  if (configStoreUnsubscribe) return;

  scoresService = createScoresService();

  const configStore = await createConfigStore();
  configStoreUnsubscribe = configStore.subscribe(async config => {
    const newMainPlayerId = opt(config, 'users.main')
    if (mainPlayerId !== newMainPlayerId) {
      mainPlayerId = newMainPlayerId;

      if (!playerScores[mainPlayerId]) playerScores[mainPlayerId] = await scoresService.getPlayerScoresAsObject(mainPlayerId);
    }
  })
}

const getPlayerScores = (playerId = mainPlayerId) => playerId && playerScores[playerId] ? playerScores[playerId] : null;

export default async (data, playerId = null) => {
  if (!data || !data.score || data.comparePlayers || !mainPlayerId || mainPlayerId === playerId) return data;

  const leaderboardId = opt(data, 'leaderboard.leaderboardId');
  if (!leaderboardId) return data;

  const comparePlayerScores = getPlayerScores(mainPlayerId);
  if (!comparePlayerScores || !comparePlayerScores[leaderboardId]) return data;

  const mainPlayerScore = await beatSaviorEnhancer(await accEnhancer(comparePlayerScores[leaderboardId]), mainPlayerId);

  data.comparePlayers = [{...mainPlayerScore, playerId: mainPlayerId, playerName: 'Me'}];

  return data;
}