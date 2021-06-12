import eventBus from '../utils/broadcast-channel-pubsub'
import log from '../utils/logger'
import createQueue from '../utils/queue'
import createConfigStore from '../stores/config';
import createRankedsStore from '../stores/scoresaber/rankeds';
import {HOUR, MINUTE} from '../utils/date'
import {opt} from '../utils/js'

const INTERVAL_TICK = MINUTE;

let mainPlayerId = null;
let rankedsStore = null;

export const TYPES = {
  RANKEDS: 'rankeds',
  ACTIVE_PLAYERS: 'active-players',
  PLAYER_SCORES: 'player-score',
  RANKEDS_NOTES_CACHE: 'rankeds-notes-cache',
}

const enqueue = async (queue, type, force = false, data = null, then = null) => {
  log.debug(`Try to enqueue type ${type}. Forced: ${force}`, 'DlManager');

  switch (type) {
    case TYPES.RANKEDS:
      log.debug(`Enqueue rankeds`, 'DlManager');

      if (!rankedsStore) rankedsStore = await createRankedsStore();
      await rankedsStore.refresh();
      break;

    case TYPES.RANKEDS_NOTES_CACHE:
      // await enqueueRankedsNotesCache(queue, then);
      break;

    case TYPES.ACTIVE_PLAYERS:
      // await enqueueActivePlayers(queue, force, then);
      break;

    case TYPES.PLAYER_SCORES:
      if (!data?.playerId) {
        // await enqueueActivePlayersScores(queue, force, then);
      } else {
        // await enqueuePlayerScores(queue, data.playerId, force, then);
      }
  }

  if (then) await then();
}

const enqueueAllJobs = async queue => {
  log.debug(`Try to enqueue & process queue.`, 'DlManager');

  // TODO:
  // await enqueueMainPlayer(queue);
  await enqueue(queue, TYPES.RANKEDS);
  await enqueue(queue, TYPES.ACTIVE_PLAYERS);
  await enqueue(queue, TYPES.PLAYER_SCORES);
  await enqueue(queue, TYPES.RANKEDS_NOTES_CACHE);
}

let intervalId;
const startSyncing = async queue => {
  await enqueueAllJobs(queue);
  intervalId = setInterval(() => enqueueAllJobs(queue), INTERVAL_TICK);
}

export default async () => {
  const queue = createQueue({
    concurrency: 1,
    timeout: HOUR * 2,
    throwOnTimeout: true,
  });

  const configStore = await createConfigStore();
  mainPlayerId = configStore.getMainPlayerId();

  configStore.subscribe(config => {
    const newMainPlayerId = opt(config, 'users.main')
    if (mainPlayerId !== newMainPlayerId) {
      mainPlayerId = newMainPlayerId;

      log.debug(`Main player changed to ${mainPlayerId}`, 'DlManager')
    }
  })

  eventBus.leaderStore.subscribe(async isLeader => {
    if (isLeader) {
      queue.clear();
      queue.start();

      log.info(`Node is a leader, queue processing enabled`, 'DlManager')

      await startSyncing(queue)
    }
  })

  eventBus.on('player-added', async (playerId) => {
    await enqueue(
      queue, TYPES.ACTIVE_PLAYERS, true,
      null,
      async () => enqueue(queue, TYPES.PLAYER_SCORES, true, {playerId}),
    );
  });

  eventBus.on('player-added-to-friends', async (playerId) => {
    await enqueue(
      queue, TYPES.ACTIVE_PLAYERS, true,
      null,
      async () => enqueue(queue, TYPES.PLAYER_SCORES, true, {playerId}),
    );
  });

  eventBus.on('dl-manager-pause-cmd', () => {
    log.debug('Pause Dl Manager', 'DlManager');

    queue.clear();
    queue.pause();
  });

  eventBus.on('dl-manager-unpause-cmd', () => {
    log.debug('Unpause Dl Manager', 'DlManager');

    queue.clear();
    queue.start();
  });


  if (eventBus.isLeader()) await startSyncing(queue);

  log.info(`Download manager initialized`, 'DlManager');
}