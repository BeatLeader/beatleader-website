import createPpService from '../../../../services/beatleader/pp'
import {configStore} from '../../../config'
import {opt} from '../../../../utils/js'

let ppService;

export default async (data, playerId = null, whatIfOnly = false) => {
  if (!playerId) return;

  const leaderboardId = opt(data, 'leaderboard.leaderboardId');
  if (!leaderboardId) return;

  const pp = opt(data, 'score.pp');
  if (!pp) return;

  if (!ppService) ppService = createPpService();

  const mainPlayerId = configStore.getMainPlayerId();
  if (mainPlayerId && mainPlayerId !== playerId) {
    const whatIfPp = await ppService.getWhatIfScore(mainPlayerId, leaderboardId, pp)
    if (whatIfPp && whatIfPp.diff >= 0.01) data.score.whatIfPp = whatIfPp
  }

  if (whatIfOnly) return;

  const ppAttribution = await ppService.getWhatIfScore(playerId, leaderboardId);
  if (!ppAttribution) return;

  data.score.ppAttribution = -ppAttribution.diff;
}