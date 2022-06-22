import cacheRepository from './repository/cache';
import keyValueRepository from './repository/key-value';
import playersRepository from './repository/players';
import playersHistoryRepository from './repository/players-history';
import scoresRepository from './repository/scores';
import twitchRepository from './repository/twitch';
import log from '../utils/logger';


export default () => {
  log.debug('Initialize DB repositories');

  // initialize all repositories in order to create cache to sync
  [cacheRepository, keyValueRepository, playersRepository, playersHistoryRepository, scoresRepository, twitchRepository].map(repository => repository());
}