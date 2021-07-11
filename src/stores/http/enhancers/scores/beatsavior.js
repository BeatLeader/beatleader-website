import createBeatSaviorService from '../../../../services/beatsavior'
import {opt} from '../../../../utils/js'

let beatSaviorService;

export default async (data, playerId = null) => {
  if (!data || !data.score || !data.leaderboard) return data;

  if (!beatSaviorService) beatSaviorService = createBeatSaviorService();

  const bsData = await beatSaviorService.get(playerId, data);
  if (!bsData) return data;

  data.beatSavior = bsData;

  return data;
}