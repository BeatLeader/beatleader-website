import createPpService from '../../../../services/beatleader/pp'
import createAccountStore from '../../../../stores/beatleader/account'

let ppService;
let accountStore;

export default async (data, playerId = null, whatIfOnly = false) => {
  if (!playerId) return;

  const leaderboardId = data?.leaderboard?.leaderboardId;
  if (!leaderboardId) return;

  const pp = data?.score?.pp;
  if (!pp) return;

  if (!ppService) ppService = createPpService();
  if (!accountStore) accountStore = createAccountStore();

  let mainPlayerId = null;
  accountStore.subscribe(account => mainPlayerId = account?.id)

  if (mainPlayerId && mainPlayerId !== playerId) {
    const whatIfPp = await ppService.getWhatIfScore(mainPlayerId, leaderboardId, pp)
    if (whatIfPp && whatIfPp.diff >= 0.01) data.score.whatIfPp = whatIfPp
  }

  if (whatIfOnly) return;

  const ppAttribution = await ppService.getWhatIfScore(playerId, leaderboardId);
  if (!ppAttribution) return;

  data.score.ppAttribution = -ppAttribution.diff;
}