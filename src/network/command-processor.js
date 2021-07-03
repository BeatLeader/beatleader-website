import eventBus from '../utils/broadcast-channel-pubsub'
import createPlayerService from '../services/scoresaber/player'
import log from '../utils/logger'

let initialized = false;

export default (dlManager) => {
  if (initialized) {
    log.debug(`Command processor already initialized.`, 'CmdProcessor');

    return;
  }

  const playerService = createPlayerService();

  eventBus.on('player-add-cmd', async ({playerId}) => {
    await dlManager.enqueuePlayer(playerId);
  });

  eventBus.on('player-remove-cmd', async ({playerId, purgeScores = false}) => {
    if (!playerId) return;

    await playerService.remove(playerId, purgeScores);
  });

  eventBus.on('dl-manager-pause-cmd', () => {
    log.debug('Pause Dl Manager', 'CmdProcessor');

    dlManager.pause();
  });

  eventBus.on('dl-manager-unpause-cmd', () => {
    log.debug('Unpause Dl Manager', 'CmdProcessor');

    dlManager.start();
  });

  initialized = true;

  log.info(`Command processor initialized`, 'CmdProcessor');
}