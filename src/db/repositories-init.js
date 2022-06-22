import cacheRepository from './repository/cache';
import groupsRepository from './repository/groups';
import keyValueRepository from './repository/key-value';
import playersRepository from './repository/players';
import playersHistoryRepository from './repository/players-history';
import scoresRepository from './repository/scores';
import songsRepository from './repository/songs';
import twitchRepository from './repository/twitch';
import log from '../utils/logger';


export default () => {
  log.debug('Initialize DB repositories');

  // initialize all repositories in order to create cache to sync
  [cacheRepository, groupsRepository, keyValueRepository, playersRepository, playersHistoryRepository, scoresRepository, songsRepository, twitchRepository].map(repository => repository());
}