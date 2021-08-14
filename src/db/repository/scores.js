import createRepository from './generic';

export default () => createRepository(
    'scores',
    'id',
    {
      'scores-timeset': 'timeset',
      'scores-leaderboardId': 'leaderboardId',
      'scores-playerId': 'playerId',
      'scores-pp': 'pp',
    },
  )