import createRepository from './generic';

export default () => createRepository('players-history', '_idbId', {
  'players-history-playerId': 'playerId',
  'players-history-playerIdSsTimestamp': 'playerIdSsTimestamp'
});