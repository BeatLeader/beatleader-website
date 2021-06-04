import {default as createQueue, PRIORITY} from '../http-queue';
import {substituteVars} from "../../utils/format";
import makePendingPromisePool from '../../utils/pending-promises'

const BEATSAVIOR_API_URL = '/cors/beat-savior';
const PLAYER_URL = BEATSAVIOR_API_URL + '/${playerId}';

const resolvePromiseOrWaitForPending = makePendingPromisePool();

export default (options = {}) => {
  const queue = createQueue(options);

  const {fetchJson, fetchHtml, ...queueToReturn} = queue;

  const fetchPlayer = async (url, signal = null, priority = PRIORITY.FG_LOW) => resolvePromiseOrWaitForPending(url, () => fetchJson(url, {signal}, priority));

  const player = async (playerId, signal = null, priority = PRIORITY.FG_LOW) => fetchPlayer(substituteVars(PLAYER_URL, {playerId}), signal, priority).then(r => r.body)

  return {
    player,
    ...queueToReturn,
  }
}