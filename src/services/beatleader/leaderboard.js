import leaderboardApiClient from '../../network/clients/beatleader/leaderboard/api-leaderboard'
import leaderboardsApiClient from '../../network/clients/beatleader/leaderboard/api-leaderboards'
import accSaberLeaderboardApiClient from '../../network/clients/accsaber/api-leaderboard'
import makePendingPromisePool from '../../utils/pending-promises'
import createPlayersService from './player'
import createScoresService from './scores'
import {PRIORITY} from '../../network/queues/http-queue'
import {LEADERBOARD_SCORES_PER_PAGE} from '../../utils/beatleader/consts'
import {LEADERBOARD_SCORES_PER_PAGE as ACCSABER_LEADERBOARD_SCORES_PER_PAGE} from '../../utils/accsaber/consts'
import {formatDateRelative, MINUTE} from '../../utils/date'
import {convertArrayToObjectByKey, opt} from '../../utils/js'
import eventBus from '../../utils/broadcast-channel-pubsub'

const ACCSABER_LEADERBOARD_NETWORK_TTL = MINUTE * 5;

let service = null;
export default () => {
  if (service) return service;

  const playersService = createPlayersService();
  const scoresService = createScoresService();

  let friendsPromise = Promise.resolve([]);
  const refreshFriends = async () => friendsPromise = playersService.getAll();
  eventBus.on('player-profile-removed', playerId => refreshFriends());
  eventBus.on('player-profile-added', player => refreshFriends());
  eventBus.on('player-profile-changed', player => refreshFriends());
  refreshFriends().then(_ => {});

  const resolvePromiseOrWaitForPending = makePendingPromisePool();

  const fetchAllLeaderboardsPage = async (page = 1, filters={}, priority = PRIORITY.FG_LOW, signal = null, force = false) => resolvePromiseOrWaitForPending(
    `apiClient/leaderboards/${page}`, () => leaderboardsApiClient.getProcessed({page, filters, signal, priority, cacheTtl: force ? null : MINUTE}));

  const fetchLeaderboardPage = async (leaderboardId, page = 1, filters = {}, priority = PRIORITY.FG_LOW, signal = null, force = false) => resolvePromiseOrWaitForPending(`apiClient/leaderboard/${leaderboardId}/${page}`, () => leaderboardApiClient.getProcessed({leaderboardId, page, filters, signal, priority, cacheTtl: force ? null : MINUTE,}));

  const fetchAccSaberPage = async (leaderboardId, page = 1, filters = {}, priority = PRIORITY.FG_LOW, signal = null, force = false) => {
    if (page < 1) page = 1;

    const data = await resolvePromiseOrWaitForPending(
      `accSaberApiClient/leaderboard/${leaderboardId}/${page}`,
      () => accSaberLeaderboardApiClient.getProcessed({
        leaderboardId,
        page,
        signal,
        priority,
        cacheTtl: ACCSABER_LEADERBOARD_NETWORK_TTL,
      }));

    if (!data || !data.scores) return data

    const startIdx = (page - 1) * ACCSABER_LEADERBOARD_SCORES_PER_PAGE;
    if (data.scores.length < startIdx + 1) return data;

    return {
      ...data,
      scores: data.scores
        .slice(startIdx, startIdx + ACCSABER_LEADERBOARD_SCORES_PER_PAGE)
    }
  }

  const getFriendsLeaderboard = async (leaderboardId, priority = PRIORITY.FG_LOW, signal = null) => {
    return []; // TODO: restore it
  }

  const destroyService = () => {
    service = null;
  }

  service = {
    fetchAllLeaderboardsPage,
    fetchLeaderboardPage,
    fetchAccSaberPage,
    getFriendsLeaderboard,
    LEADERBOARD_SCORES_PER_PAGE,
    destroyService,
  }

  return service;
}