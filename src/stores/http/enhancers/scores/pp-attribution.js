import createPpService from '../../../../services/scoresaber/pp'
import {opt} from '../../../../utils/js'

let ppService;

export default async (data, playerId = null) => {
  if (!playerId) return;

  const leaderboardId = opt(data, 'leaderboard.leaderboardId');
  if (!leaderboardId) return;

  const pp = opt(data, 'score.pp');
  if (!pp) return;

  if (!ppService) ppService = createPpService();

  const whatIfPp = await ppService.getWhatIfScore(playerId, leaderboardId);
  if (!whatIfPp) return;

  data.score.ppAttribution = -whatIfPp.diff;
}