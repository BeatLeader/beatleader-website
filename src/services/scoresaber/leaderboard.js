import leaderboardPageClient from '../../network/scoresaber/leaderboard/page-leaderboard'
import makePendingPromisePool from '../../utils/pending-promises'
import {PRIORITY} from '../../network/http-queue'
import {LEADERBOARD_SCORES_PER_PAGE} from '../../utils/scoresaber/consts'
import {MINUTE} from '../../utils/date'

let service = null;
export default () => {
  if (service) return service;

  const resolvePromiseOrWaitForPending = makePendingPromisePool();

  const fetchPage = async (leaderboardId, page = 1, priority = PRIORITY.FG_LOW, signal = null, force = false) => {
    // TODO: add fetch cache support

    return resolvePromiseOrWaitForPending(`pageClient/leaderboard/${leaderboardId}/${page}`, () => leaderboardPageClient.getProcessed({leaderboardId, page, signal, priority, cacheTtl: MINUTE}));
  }

  const getFriendsLeaderboard = async (leaderboardId, priority = PRIORITY.FG_LOW, signal = null) => {
    // TODO
    return null;
  }

  const destroyService = () => {
    service = null;
  }

  service = {
    fetchPage,
    getFriendsLeaderboard,
    LEADERBOARD_SCORES_PER_PAGE,
    destroyService,
  }

  return service;
}