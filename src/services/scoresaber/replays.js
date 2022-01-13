import createScoresService from './scores'
import makePendingPromisePool from '../../utils/pending-promises'
import {getTotalPpFromSortedPps} from '../../utils/scoresaber/pp'

const SS_CORS_HOST = '/cors/score-saber';

let service = null;
export default () => {
  if (service) return service;

  const resolvePromiseOrWaitForPending = makePendingPromisePool();

  function headRequest(url) {
    return new Promise(function (resolve, reject) {
        var xhr = new XMLHttpRequest();
        xhr.open('head', url, true);
        xhr.onload = function () {
            resolve(xhr.status == 200);
        };
        xhr.send();
    });
}

  const replaysExists = async (playerId, leaderboardId) => {
    return await headRequest(SS_CORS_HOST + "/game/replays/" + leaderboardId + "-" + playerId + ".dat")
  };

  service = {
    replaysExists
  }

  return service;
}