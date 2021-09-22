import createRepository from './generic';

export default () => createRepository(
  'accsaber-players',
  'id',
  {
    'accsaber-players-playerId': 'playerId',
    'accsaber-players-category': 'category',
  },
);