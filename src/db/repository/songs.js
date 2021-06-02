import createRepository from './generic';

let repository;

export default () => repository ? repository : repository = createRepository('songs', 'hash', {'songs-key': 'key'});