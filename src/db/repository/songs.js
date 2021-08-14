import createRepository from './generic';

export default () => createRepository('songs', 'hash', {'songs-key': 'key'});