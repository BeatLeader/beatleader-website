import createRepository from './generic';

export default () => createRepository('accsaber-players-history', '_idbId', {
  'accsaber-players-history-playerId': 'playerId',
  'accsaber-players-history-playerIdTimestamp': 'playerIdTimestamp'
});