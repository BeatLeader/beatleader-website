import createBeatSaviorService from '../../../../services/beatsavior'
import {opt} from '../../../../utils/js'

let beatSaviorService;

export default async (data, playerId = null) => {
  if (!data || !data.score || !data.leaderboard) return data;

  if (!beatSaviorService) beatSaviorService = createBeatSaviorService();

  const bsData = await beatSaviorService.get(playerId, data);
  if (!bsData) return data;

  if (!data.score.acc) {
    const acc = opt(bsData, 'trackers.scoreTracker.rawRatio');
    if (acc) data.score.acc = acc * 100;
  }

  if (!data.score.percentage) {
    const percentage = opt(bsData, 'trackers.scoreTracker.modifiedRatio');
    if (percentage) data.score.percentage = percentage * 100;
  }

  data.beatSavior = bsData;

  return data;
}