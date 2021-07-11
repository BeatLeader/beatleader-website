import createBeatSaviorService from '../../../../services/beatsavior'
import {opt} from '../../../../utils/js'

let beatSaviorService;

export default async (data, playerId = null) => {
  const leaderboardId = opt(data, 'leaderboard.leaderboardId');

  if (!data || !data.score || !leaderboardId) return data;

  if (!beatSaviorService) beatSaviorService = createBeatSaviorService();

  const bsData = beatSaviorService.get(playerId, leaderboardId);
  if (!bsData) return data;

  data.score.beatSavior = bsData;

  return data;
}