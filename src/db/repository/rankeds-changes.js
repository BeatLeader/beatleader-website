import createRepository from './generic';

let repository;

export default () => repository ? repository : repository = createRepository('rankeds-changes', '_idbId', {'rankeds-changes-timestamp': 'timestamp', 'rankeds-changes-leaderboardId': 'leaderboardId'});