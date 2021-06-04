import beatSaviorService from '../../../../services/beatsavior'
import {opt} from '../../../../utils/js'

const beatSavior = beatSaviorService();

export default async (data, playerId = null) => {
  const leaderboardId = opt(data, 'leaderboard.leaderboardId');

  if (!data || !data.score || !leaderboardId) return data;

  const bsData = beatSavior.get(playerId, leaderboardId);
  if (!bsData) return data;

  data.score.beatSavior = bsData;

  return data;
}