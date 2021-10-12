import createBeatSaviorService from '../../../../services/beatsavior'
import {opt} from '../../../../utils/js'
import {PRIORITY} from '../../../../network/queues/http-queue'

let beatSaviorService;

export default async (data, playerId = null) => {
  if (!data || !data.score || !data.leaderboard) return;

  if (!beatSaviorService) beatSaviorService = createBeatSaviorService();

  await beatSaviorService.refresh(playerId, false, PRIORITY.FG_LOW);

  const bsData = await beatSaviorService.get(playerId, data);
  if (!bsData) return;

  if (bsData?.stats)
    ['left', 'right'].forEach(hand => {
      ['Preswing', 'Postswing'].forEach(stat => {
        const key = `${hand}${stat}`;
        if (!bsData?.stats?.[key])
          bsData.stats[key] = bsData?.trackers?.accuracyTracker?.[key] ?? null;
      })
    })

  const acc = opt(bsData, 'trackers.scoreTracker.rawRatio');
  if (acc) data.score.acc = acc * 100;

  const percentage = opt(bsData, 'trackers.scoreTracker.modifiedRatio');
  if (percentage) data.score.percentage = percentage * 100;

  data.beatSavior = bsData;
}