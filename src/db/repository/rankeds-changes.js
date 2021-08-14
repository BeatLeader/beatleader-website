import createRepository from './generic';

export default () => createRepository('rankeds-changes', '_idbId', {'rankeds-changes-timestamp': 'timestamp', 'rankeds-changes-leaderboardId': 'leaderboardId'});