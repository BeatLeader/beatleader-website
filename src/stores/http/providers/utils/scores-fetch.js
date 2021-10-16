import createScoresService from '../../../../services/scoresaber/scores'
import createAccSaberService from '../../../../services/accsaber'
import createBeatSaviorService from '../../../../services/beatsavior'

let scoreFetcher = null;

let ssScoresService = null;
let accSaberService = null;
let beatSaviorService = null;

export default () => {
  if (scoreFetcher) return scoreFetcher;

  ssScoresService = createScoresService();
  accSaberService = createAccSaberService();
  beatSaviorService = createBeatSaviorService();

  const fetchCachedScores = async (playerId, service, serviceParams = {sort: 'recent', order: 'desc', page: 1}, otherParams = {}) => {
    switch (service) {
      case 'beatsavior':
        return beatSaviorService.getPlayerScoresPage(playerId, serviceParams);
      case 'accsaber':
        return accSaberService.getPlayerScoresPage(playerId, serviceParams);
      case 'scoresaber':
      default:
        return ssScoresService.getPlayerScoresPage(playerId, serviceParams);
    }
  }

  const fetchLiveScores = async (player, service, serviceParams = {sort: 'recent', order: 'desc', page: 1}, otherParams = {}) => {
    switch (service) {
      case 'beatsavior':
        return beatSaviorService.getPlayerScoresPage(player?.playerId, serviceParams);
      case 'accsaber':
        // TODO: use other params like in SS scores service
        return accSaberService.getPlayerScoresPage(player?.playerId, serviceParams);
      case 'scoresaber':
      default:
        return ssScoresService.fetchScoresPageOrGetFromCache(player, serviceParams, otherParams?.refreshInterval, otherParams?.priority, otherParams?.signal, otherParams?.force);
    }
  }

  scoreFetcher = {fetchCachedScores, fetchLiveScores}

  return scoreFetcher;
}