import createRepository from './generic';

export default () => createRepository(
    'scores-update-queue',
    'id',
    {
      'scores-update-queue-fetchedAt': 'fetchedAt',
    },
  )