import createRepository from './generic';

export default () => createRepository('songs-beatmaps', 'hash', {'songs-beatmaps-key': 'key'});
