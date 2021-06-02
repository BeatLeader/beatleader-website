import createRepository from './generic';

let repository;

export default () => repository ? repository : repository = createRepository('groups', '_idbId', {'groups-name': 'name', 'groups-playerId': 'playerId'});