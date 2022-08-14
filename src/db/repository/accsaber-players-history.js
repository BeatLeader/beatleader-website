import createRepository from './generic';

export default () =>
	createRepository('accsaber-players-history', 'playerIdTimestamp', {
		'accsaber-players-history-playerId': 'playerId',
		'accsaber-players-history-playerIdTimestamp': 'playerIdTimestamp',
	});
