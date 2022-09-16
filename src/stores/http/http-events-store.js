import createApiEventsProvider from './providers/api-events';
import paggedStoreWithFilters from './http-store-pagged-with-filters';

export default (page = 1, filters = {}, initialState = null, initialStateType = 'initial', force = true) =>
	paggedStoreWithFilters(createApiEventsProvider(), page, filters, initialState, initialStateType, force);
