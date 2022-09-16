import createApiLeaderboardsProvider from './providers/api-leaderboards';
import paggedStoreWithFilters from './http-store-pagged-with-filters';

export default (page = 1, filters = {}, initialState = null, initialStateType = 'initial', force = true) =>
	paggedStoreWithFilters(createApiLeaderboardsProvider(), page, filters, initialState, initialStateType, force);
