import eventBus from '../utils/broadcast-channel-pubsub'
import log from '../utils/logger'
import createQueue, {PRIORITY} from '../utils/queue'
import {configStore} from '../stores/config'
import createRankedsStore from '../stores/scoresaber/rankeds'
import createPlayerService from '../services/scoresaber/player'
import createScoresService from '../services/scoresaber/scores'
import createBeatSaviorService from '../services/beatsavior'
import {PRIORITY as HTTP_QUEUE_PRIORITY} from './queues/http-queue'
import {HOUR, MINUTE} from '../utils/date'
import {opt} from '../utils/js'

const INTERVAL_TICK = MINUTE;

let initialized = false;
let mainPlayerId = null;
let rankedsStore = null;
let playerService = null;
let scoresService = null;
let beatSaviorService = null;

const TYPES = {
  BEATSAVIOR: {name: 'BEATSAVIOR', priority: PRIORITY.LOW},
  RANKEDS: {name: 'RANKEDS', priority: PRIORITY.LOW},
  PLAYER_SCORES: {name: 'PLAYER-SCORES', priority: PRIORITY.NORMAL},
  ACTIVE_PLAYERS: {name: 'ACTIVE-PLAYERS', priority: PRIORITY.HIGH},
  MAIN_PLAYER: {name: 'MAIN-PLAYER', priority: PRIORITY.HIGHEST},
}

const enqueue = async (queue, type, force = false, data = null, then = null) => {
  if (!type || !type.name || !Number.isFinite(type.priority)) {
    log.warn(`Unknown type enqueued.`, 'DlManager', type);

    return;
  }

  log.debug(`Try to enqueue type ${type.name}. Forced: ${force}, data: ${JSON.stringify(data)}`, 'DlManager');

  const priority = force ? PRIORITY.HIGHEST : type.priority;
  const networkPriority = priority === PRIORITY.HIGHEST ? HTTP_QUEUE_PRIORITY.BG_HIGH : HTTP_QUEUE_PRIORITY.BG_NORMAL;

  const processThen = async (promise, then = null) => {
    promise.then(result => {
      if(then) log.debug('Processing then command...', 'DlManager');

      return then ? {result, thenResult: then()} : result;
    })
  }

  switch (type) {
    case TYPES.MAIN_PLAYER:
      if (mainPlayerId) {
        log.debug(`Enqueue main player`, 'DlManager');

        await Promise.all([
          enqueue(queue, {...TYPES.ACTIVE_PLAYERS, priority: PRIORITY.HIGHEST}, force, {playerId: mainPlayerId}),
          enqueue(queue, {...TYPES.PLAYER_SCORES, priority: PRIORITY.HIGHEST}, force, {playerId: mainPlayerId}),
        ]);
      }
      break;

    case TYPES.RANKEDS:
      log.debug(`Enqueue rankeds`, 'DlManager');

      if (!rankedsStore) rankedsStore = await createRankedsStore();

      processThen(queue.add(async () => rankedsStore.refresh(force, networkPriority), priority), then)
        .then(_ => log.debug('Enqueued rankeds processed.', 'DlManager'));
      break;

    case TYPES.ACTIVE_PLAYERS:
      log.debug(`Enqueue active players`, 'DlManager');

      if (data && data.playerId) {
        if (data.add)
          processThen(queue.add(async () => playerService.add(data.playerId, networkPriority), priority), then)
            .then(_ => log.debug('Enqueued active players processed.', 'DlManager'));
        else
          processThen(queue.add(async () => playerService.refresh(data.playerId, force, networkPriority), priority), then)
            .then(_ => log.debug('Enqueued active players processed.', 'DlManager'));
      } else
        processThen(queue.add(async () => playerService.refreshAll(force, networkPriority), priority), then)
          .then(_ => log.debug('Enqueued active players processed.', 'DlManager'));
      break;

    case TYPES.PLAYER_SCORES:
      log.debug(`Enqueue players scores`, 'DlManager');

      if (data && data.playerId)
        processThen(queue.add(async () => scoresService.refresh(data.playerId, force, networkPriority), priority), then)
          .then(_ => log.debug('Enqueued players scores processed.', 'DlManager'));
      else
        processThen(queue.add(async () => scoresService.refreshAll(force, networkPriority), priority), then)
          .then(_ => log.debug('Enqueued players scores processed.', 'DlManager'));
      break;

    case TYPES.BEATSAVIOR:
      log.debug(`Enqueue Beat Savior`, 'DlManager');

      processThen(queue.add(async () => beatSaviorService.refreshAll(force, networkPriority), priority), then)
        .then(_ => log.debug('Enqueued Beat Savior processed.', 'DlManager'));

      break;
  }
}

const enqueueAllJobs = async queue => {
  log.debug(`Try to enqueue & process queue.`, 'DlManager');

  await Promise.all([
    enqueue(queue, TYPES.MAIN_PLAYER),
    enqueue(queue, TYPES.RANKEDS),
    enqueue(queue, TYPES.ACTIVE_PLAYERS),
    enqueue(queue, TYPES.PLAYER_SCORES),
    enqueue(queue, TYPES.BEATSAVIOR),
  ])
}

let intervalId;
const startSyncing = async queue => {
  await enqueueAllJobs(queue);
  intervalId = setInterval(() => enqueueAllJobs(queue), INTERVAL_TICK);
}

export default async () => {
  if (initialized) {
    log.debug(`Download manager already initialized.`, 'DlManager');

    return;
  }

  const queue = createQueue({
    concurrency: 2,
    timeout: HOUR * 2,
    throwOnTimeout: true,
  });

  mainPlayerId = configStore.getMainPlayerId();

  configStore.subscribe(config => {
    const newMainPlayerId = opt(config, 'users.main')
    if (mainPlayerId !== newMainPlayerId) {
      mainPlayerId = newMainPlayerId;

      log.debug(`Main player changed to ${mainPlayerId}`, 'DlManager')
    }
  })

  playerService = createPlayerService();
  scoresService = createScoresService();
  beatSaviorService = createBeatSaviorService();

  eventBus.leaderStore.subscribe(async isLeader => {
    if (isLeader) {
      queue.clear();
      queue.start();

      const nodeId = eventBus.getNodeId();
      log.info(`Node ${nodeId} is a leader, queue processing enabled`, 'DlManager')

      await startSyncing(queue)
    }
  })

  const enqueuePlayer = async playerId => {
    await enqueue(
      queue, TYPES.ACTIVE_PLAYERS, true,
      {playerId, add: true},
      async () => enqueue(queue, TYPES.PLAYER_SCORES, true, {playerId}),
    );
  }

  const pause = () => {
    log.debug('Pause Dl Manager', 'DlManager');

    queue.clear();
    queue.pause();
  };

  const start = () => {
    log.debug('Unpause Dl Manager', 'DlManager');

    queue.clear();
    queue.start();
  };

  if (eventBus.isLeader()) await startSyncing(queue);

  initialized = true;

  log.info(`Download manager initialized`, 'DlManager');

  return {
    start,
    pause,
    enqueuePlayer
  }
}