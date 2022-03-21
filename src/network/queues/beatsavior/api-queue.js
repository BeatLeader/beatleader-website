import {default as createQueue, PRIORITY} from '../http-queue';
import {substituteVars} from "../../../utils/format";

const BEATSAVIOR_API_URL = 'https://beat-savior.herokuapp.com/api/livescores/player';
const PLAYER_URL = BEATSAVIOR_API_URL + '/${playerId}';

export default (options = {}) => {
  const queue = createQueue(options);

  const {fetchJson, fetchHtml, ...queueToReturn} = queue;

  const player = async (playerId, priority = PRIORITY.FG_LOW, options = {}) => fetchJson(substituteVars(PLAYER_URL, {playerId}), options, priority)

  return {
    player,
    ...queueToReturn,
  }
}