import createRepository from './generic';

let repository;

export default () => repository ? repository : repository = createRepository('songs-beatmaps', 'hash', {'songs-beatmaps-key': 'key'});