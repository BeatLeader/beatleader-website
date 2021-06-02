import createRepository from './generic';

let repository;

export default () => repository ? repository : repository = createRepository('beat-savior-files', 'fileId');