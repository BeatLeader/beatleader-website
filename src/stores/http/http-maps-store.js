import createApiMapsProvider from './providers/api-maps';
import paggedStoreWithFilters from './http-store-pagged-with-filters';

export default (page = 1, type = 'ranked', filters = {}, initialState = null, initialStateType = 'initial', force = true) =>
	paggedStoreWithFilters(createApiMapsProvider(), page, type, filters, initialState, initialStateType, force);
