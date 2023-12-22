import createApiReepresetsProvider from './providers/api-reepresets';
import paggedStoreWithFilters from './http-store-pagged-with-filters';

export default (page = 1, filters = {}, initialState = null, initialStateType = 'initial', force = true) =>
	paggedStoreWithFilters(createApiReepresetsProvider(), page, filters, initialState, initialStateType, force);
