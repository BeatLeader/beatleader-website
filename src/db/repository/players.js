import createRepository from './generic';

let repository;

export default () => repository ? repository : repository = createRepository('players', 'id');