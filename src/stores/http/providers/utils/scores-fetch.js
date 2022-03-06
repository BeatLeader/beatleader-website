import createScoresService from '../../../../services/beatleader/scores'
import createAccSaberService from '../../../../services/accsaber'
import createBeatSaviorService from '../../../../services/beatsavior'
import {capitalize} from '../../../../utils/js'

let scoreFetcher = null;

let blScoresService = null;
let accSaberService = null;
let beatSaviorService = null;

export default () => {
  if (scoreFetcher) return scoreFetcher;

  blScoresService = createScoresService();
  accSaberService = createAccSaberService();
  beatSaviorService = createBeatSaviorService();

  const processServiceParamsFilters = serviceParams => {
    if (!serviceParams) return serviceParams;

    const {filters: {stars = {}, ...restFilters} = {}, ...restParams} = serviceParams;

    return {
      ...restParams,
      filters: {
        ...restFilters,
        ...Object.entries(stars ?? {}).reduce((starFilter, [key, value]) => ({
          ...starFilter,
          [`stars${capitalize(key)}`]: value,
        }), {}),
      }
    }
  }

  const fetchCachedScores = async (playerId, service, serviceParams = {sort: 'date', order: 'desc', page: 1}, otherParams = {}) => {
    const processedServiceParams = processServiceParamsFilters(serviceParams);

    switch (service) {
      case 'beatsavior':
        return beatSaviorService.getPlayerScoresPage(playerId, processedServiceParams);
      case 'accsaber':
        return accSaberService.getPlayerScoresPage(playerId, processedServiceParams);
      case 'beatleader':
      default:
        return blScoresService.getPlayerScoresPage(playerId, processedServiceParams);
    }
  }

  const fetchLiveScores = async (player, service, serviceParams = {sort: 'date', order: 'desc', page: 1}, otherParams = {}) => {
    const processedServiceParams = processServiceParamsFilters(serviceParams);

    switch (service) {
      case 'beatsavior':
        return beatSaviorService.getPlayerScoresPage(player?.playerId, processedServiceParams);
      case 'accsaber':
        return accSaberService.getPlayerScoresPage(player?.playerId, processedServiceParams);
      case 'beatleader':
      default:
        return blScoresService.fetchScoresPageOrGetFromCache(player, processedServiceParams, otherParams?.refreshInterval, otherParams?.priority, otherParams?.signal, otherParams?.force);
    }
  }

  scoreFetcher = {fetchCachedScores, fetchLiveScores}

  return scoreFetcher;
}