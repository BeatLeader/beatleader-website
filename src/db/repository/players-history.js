import createRepository from './generic';

let repository;

export default () => repository ? repository : repository = createRepository('players-history', '_idbId', {'players-history-playerId': 'playerId', 'players-history-timestamp': 'timestamp'});