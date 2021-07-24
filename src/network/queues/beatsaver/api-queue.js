import {default as createQueue, PRIORITY} from '../http-queue';
import {substituteVars} from "../../../utils/format";

const BEATSAVER_API_URL = 'https://beatsaver.com/api';
const SONG_BY_HASH_URL = BEATSAVER_API_URL + '/maps/by-hash/${hash}';
const SONG_BY_KEY_URL = BEATSAVER_API_URL + '/maps/detail/${key}'

export default (options = {}) => {
  const queue = createQueue(options);

  const {fetchJson, fetchHtml, ...queueToReturn} = queue;

  const byHash = async (hash, priority = PRIORITY.FG_LOW, options = {}) => fetchJson(substituteVars(SONG_BY_HASH_URL, {hash}), priority, options)
  const byKey = async (key, priority = PRIORITY.FG_LOW, options = {}) => fetchJson(substituteVars(SONG_BY_KEY_URL, {key}), priority, options)

  return {
    byHash,
    byKey,
    ...queueToReturn,
  }
}