import createScoresService from './scores'
import makePendingPromisePool from '../../utils/pending-promises'

const WEIGHT_COEFFICIENT = 0.965;

let service = null;
let serviceCreationCount = 0;
export default () => {
  serviceCreationCount++;
  if (service) return service;

  const scoresService = createScoresService();

  const resolvePromiseOrWaitForPending = makePendingPromisePool();

  const getTotalPpFromSortedPps = ppArray => ppArray.reduce((cum, pp, idx) => cum + Math.pow(WEIGHT_COEFFICIENT, idx) * pp, 0);

  const getTotalPp = scores => scores && Array.isArray(scores)
    ? getTotalPpFromSortedPps(
      scores
        .filter(s => s.pp > 0)
        .map(s => s.pp)
        .sort((a, b) => b - a),
    )
    : null;

  const getTotalPlayerPp = async (playerId, modifiedScores = {}) => getTotalPp(
    Object.values({
      ...(await resolvePromiseOrWaitForPending(`scores/${playerId}`, () => scoresService.getPlayerScoresAsObject(playerId))),
      ...modifiedScores,
    }),
  );

  async function getWhatIfScore(playerId, leaderboardId, pp = 0) {
    const currentTotalPp = await getTotalPlayerPp(playerId);
    if (!currentTotalPp) return null;

    const newTotalPp = await getTotalPlayerPp(playerId, {
      [leaderboardId]: {pp},
    });

    return {
      currentTotalPp,
      newTotalPp,
      diff: newTotalPp - currentTotalPp,
    };
  }

  const destroyService = () => {
    serviceCreationCount--;

    if (serviceCreationCount === 0) {
      scoresService.destroyService();

      service = null;
    }
  }

  service = {
    getWhatIfScore,
    getTotalPlayerPp,
    getTotalPp,
    destroyService,
  }

  return service;
}