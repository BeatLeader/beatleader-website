import {PRIORITY} from '../network/http-queue';
import createPlayerService from './scoresaber/player'
import createScoresService from './scoresaber/scores'
import beatSaviorApiClient from '../network/beatsavior/api';
import beatSaviorRepository from '../db/repository/beat-savior'
import beatSaviorPlayersRepository from '../db/repository/beat-savior-players'
import {addToDate, DAY, formatDate, HOUR, MINUTE, SECOND} from '../utils/date'
import log from '../utils/logger'
import {opt} from '../utils/js'
import makePendingPromisePool from '../utils/pending-promises'

const MAIN_PLAYER_REFRESH_INTERVAL = MINUTE * 15;
const CACHED_PLAYER_REFRESH_INTERVAL = HOUR * 3;
const OTHER_PLAYER_REFRESH_INTERVAL = DAY;

let service = null;
let serviceCreationCount = 0;
export default () => {
  serviceCreationCount++;
  if (service) return service;

  const resolvePromiseOrWaitForPending = makePendingPromisePool();

  const playerService = createPlayerService();
  const scoresService = createScoresService();

  const updateData = async (playerId, data) => {
    log.debug(`Updating Beat Savior data for player "${playerId}"...`, 'BeatSaviorService')

    // find score matches
    log.trace(`Getting player "${playerId}" scores from DB...`, 'BeatSaviorService')

    const playerScores = await scoresService.getPlayerScoresAsObject(
      playerId,
      score => {
        const key = opt(score, 'leaderboard.song.hash');
        return key ? key.toLowerCase() : null;
      },
      true,
    );

    if (playerScores) {
      const scoresToUpdate = data
        .map(d => {
          if (!d.hash || !d.score || !d.timeSet || !opt(d, 'stats.won')) return null;

          const songScores = playerScores && playerScores[d.hash] ? playerScores[d.hash] : null;
          if (!songScores) return null;

          const exactScore = songScores.find(s => {
            const diff = opt(s, 'leaderboard.diffInfo.diff');
            const score = opt(s, 'score.score');
            const timeSet = opt(s, 'score.timeSet')

            if (!diff || !score || !timeSet) return false;

            if (d.diff === diff) {
              // update BeatSavior data in the same step
              d.leaderboardId = s.leaderboardId;
              d.leaderboard.s = s.leaderboardId;

              if (d.score === score && Math.abs(timeSet.getTime() - d.timeSet.getTime()) < MINUTE) {
                d.scoreId = opt(s, 'score.scoreId');

                return true;
              }
            }

            return false;
          });

          if (!exactScore) return null;

          return exactScore;
          return {...exactScore, beatSavior: d};
        })
        .filter(s => s);

      log.debug(`Update player "${playerId}" scores with Beat Savior data...`, 'BeatSaviorService')

      await Promise.all(scoresToUpdate.map(async s => scoresService.update(s)))
    }

    log.debug(`Update player "${playerId}" Beat Savior data...`, 'BeatSaviorService')

    await Promise.all(data.map(async d => beatSaviorRepository().set(d)));

    log.debug(`Update player "${playerId}" Beat Savior last refresh date...`, 'BeatSaviorService')

    await beatSaviorPlayersRepository().set({playerId, lastRefresh: new Date()})

    log.debug(`Beat Savior data for player "${playerId}" updated.`, 'BeatSaviorService')

    return data;
  }

  const fetchPlayer = async (playerId, priority = PRIORITY.BG_NORMAL) => {
    try {
      log.debug(`Fetching Beat Savior data for player "${playerId}"...`, 'BeatSaviorService');

      const data = await beatSaviorApiClient.getProcessed({playerId, priority});
      if (!data) {
        log.debug(`No Beat Savior data for player "${playerId}"`, 'BeatSaviorService')

        return null;
      }

      // TODO: check if data already exists in DB

      log.trace(`Beat Savior data for player "${playerId}" fetched`, 'BeatSaviorService', data);

      return updateData(playerId, data);
    } catch (err) {
      log.warn(`Error fetching Beat Savior data for player "${playerId}"`);

      return null;
    }
  }

  const refresh = async (playerId, force = false, priority = PRIORITY.BG_NORMAL, throwErrors = false) => {
    log.trace(`Starting refreshing BeatSavior for player "${playerId}" ${force ? ' (forced)' : ''}...`, 'BeatSaviorService')

    try {
      const player = await playerService.get(playerId);

      const REFRESH_INTERVAL = playerService.isMainPlayer(playerId) ? MAIN_PLAYER_REFRESH_INTERVAL : (player ? CACHED_PLAYER_REFRESH_INTERVAL : OTHER_PLAYER_REFRESH_INTERVAL);

      const bsPlayerInfo = await beatSaviorPlayersRepository().get(playerId);
      const nextUpdate = bsPlayerInfo && bsPlayerInfo.lastRefresh ? addToDate(REFRESH_INTERVAL, bsPlayerInfo.lastRefresh) : addToDate(-SECOND);
      if (!force && bsPlayerInfo && nextUpdate > new Date()) {
        log.debug(`Beat Savior data is still fresh, skipping. Next refresh on ${formatDate(nextUpdate)}`, 'BeatSaviorService')

        return null;

        if (player) {
          log.trace(`Player "${playerId}" is a cached one, checking recent play date`, 'BeatSaviorService')

          if (player.recentPlay && player.recentPlay < bsPlayerInfo.lastRefresh) {
            log.debug(`Beat Savior data for player "${playerId}" was refreshed after recent play, skipping`, 'BeatSaviorService')

            return null;
          }
        }
      }

      return resolvePromiseOrWaitForPending(`refresh/${playerId}`, () => fetchPlayer(playerId, priority));
    } catch (e) {
      if (throwErrors) throw e;

      log.debug(`Beat Savior data refreshing error${e.toString ? `: ${e.toString()}` : ''}`, 'BeatSaviorService', e)

      return null;
    }
  }

  const refreshAll = async (force = false, priority = PRIORITY.BG_NORMAL, throwErrors = false) => {
    log.trace(`Starting refreshing Beat Savior data for all players${force ? ' (forced)' : ''}...`, 'BeatSaviorService');

    const allPlayers = await playerService.getAll();
    if (!allPlayers || !allPlayers.length) {
      log.trace(`No players in DB, skipping.`, 'BeatSaviorService');
      return null;
    }

    const allRefreshed = await Promise.all(allPlayers.map(async player => ({
      playerId: player.playerId,
      beatSavior: await refresh(player.playerId, force, priority, throwErrors),
    })));

    log.trace(`Beat Savior data for all players refreshed.`, 'BeatSaviorService', allRefreshed);

    return allRefreshed;
  }

  const get = (playerId, leaderboardId) => {
    // TODO:

    return null;
  }

  const destroyService = () => {
    serviceCreationCount--;

    if (serviceCreationCount === 0) {
      scoresService.destroyService();
      playerService.destroyService();

      service = null;
    }
  }

  service = {
    refresh,
    refreshAll,
    get,
    destroyService,
  }

  return service;
}