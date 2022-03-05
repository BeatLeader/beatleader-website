import createScoresService from '../../../../services/beatleader/scores'
import createAccSaberService from '../../../../services/accsaber'
import createBeatSaviorService from '../../../../services/beatsavior'

let scoreFetcher = null;

let blScoresService = null;
let accSaberService = null;
let beatSaviorService = null;

export default () => {
  if (scoreFetcher) return scoreFetcher;

  blScoresService = createScoresService();
  accSaberService = createAccSaberService();
  beatSaviorService = createBeatSaviorService();

  const fetchCachedScores = async (playerId, service, serviceParams = {sort: 'date', order: 'desc', page: 1}, otherParams = {}) => {
    switch (service) {
      case 'beatsavior':
        return beatSaviorService.getPlayerScoresPage(playerId, serviceParams);
      case 'accsaber':
        return accSaberService.getPlayerScoresPage(playerId, serviceParams);
      case 'beatleader':
      default:
        return blScoresService.getPlayerScoresPage(playerId, serviceParams);
    }
  }

  const fetchLiveScores = async (player, service, serviceParams = {sort: 'date', order: 'desc', page: 1}, otherParams = {}) => {
    switch (service) {
      case 'beatsavior':
        return beatSaviorService.getPlayerScoresPage(player?.playerId, serviceParams);
      case 'accsaber':
        return accSaberService.getPlayerScoresPage(player?.playerId, serviceParams);
      case 'beatleader':
      default:
        return blScoresService.fetchScoresPageOrGetFromCache(player, serviceParams, otherParams?.refreshInterval, otherParams?.priority, otherParams?.signal, otherParams?.force);
    }
  }

  scoreFetcher = {fetchCachedScores, fetchLiveScores}

  return scoreFetcher;
}