import createRepository from './generic';

let repository;

export default () => repository ? repository : repository = createRepository('beat-savior', 'beatSaviorId', {'beat-savior-playerId': 'playerId', 'beat-savior-songId': 'songId', 'beat-savior-fileId': 'fileId'});