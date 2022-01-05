import createRepository from './generic';

export default () => createRepository(
    'scores',
    'id',
    {
      'scores-timeSet': 'timeSet',
      'scores-leaderboardId': 'leaderboardId',
      'scores-playerId': 'playerId',
      'scores-pp': 'pp',
    },
  )