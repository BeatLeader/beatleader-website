import createRepository from './generic';

export default () => createRepository('beat-savior', 'beatSaviorId', {'beat-savior-playerId': 'playerId', 'beat-savior-songId': 'songId', 'beat-savior-fileId': 'fileId'});