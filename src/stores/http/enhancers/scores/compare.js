import {configStore} from '../../../config'
import createScoresService from '../../../../services/scoresaber/scores'
import accEnhancer from './acc'
import beatSaviorEnhancer from './beatsavior'
import beatSaverEnhancer from '../leaderboard/beatsaver'
import {opt} from '../../../../utils/js'
import produce from 'immer'

let scoresService = null;
let mainPlayerId = null;
let playerScores = {};

let configStoreUnsubscribe = null;

export const initCompareEnhancer = async () => {
  if (configStoreUnsubscribe) return;

  scoresService = createScoresService();

  configStoreUnsubscribe = configStore.subscribe(async config => {
    const newMainPlayerId = opt(config, 'users.main')
    if (mainPlayerId !== newMainPlayerId) {
      mainPlayerId = newMainPlayerId;

      if (!playerScores[mainPlayerId]) playerScores[mainPlayerId] = await scoresService.getPlayerScoresAsObject(mainPlayerId);
    }
  })
}

export default async (data, playerId = null) => {
  if (!data || !data.score || data.comparePlayers || !mainPlayerId || mainPlayerId === playerId) return;

  const leaderboardId = opt(data, 'leaderboard.leaderboardId');
  if (!leaderboardId) return;

  const comparePlayerScores = await playerScores[mainPlayerId];
  if (!comparePlayerScores || !comparePlayerScores[leaderboardId]) return;

  const mainPlayerScore = await produce(
    await produce(
      await produce(
        comparePlayerScores[leaderboardId],
        draft => beatSaverEnhancer(draft),
      ),
      draft => accEnhancer(draft, true),
    ),
    draft => beatSaviorEnhancer(draft, mainPlayerId),
  );

  data.comparePlayers = [{...mainPlayerScore, playerId: mainPlayerId, playerName: 'Me'}];
}