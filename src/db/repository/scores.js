import createRepository from './generic';

let repository;

export default () => repository
  ? repository
  : repository = createRepository(
    'scores',
    'id',
    {
      'scores-timeset': 'timeset',
      'scores-leaderboardId': 'leaderboardId',
      'scores-playerId': 'playerId',
      'scores-pp': 'pp',
    }
  );