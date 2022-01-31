import {default as createQueue, PRIORITY} from '../http-queue';
import {substituteVars} from "../../../utils/format";

const BEATMAPS_API_URL = 'https://api.beatsaver.com';
const SONG_BY_HASH_URL = BEATMAPS_API_URL + '/maps/hash/${hash}';
const SONG_BY_KEY_URL = BEATMAPS_API_URL + '/maps/id/${key}'

export default (options = {}) => {
  const queue = createQueue(options);

  const {fetchJson, fetchHtml, ...queueToReturn} = queue;

  const byHash = async (hash, priority = PRIORITY.FG_LOW, options = {}) => fetchJson(substituteVars(SONG_BY_HASH_URL, {hash}), options, priority)
  const byKey = async (key, priority = PRIORITY.FG_LOW, options = {}) => fetchJson(substituteVars(SONG_BY_KEY_URL, {key}), options, priority)

  return {
    byHash,
    byKey,
    ...queueToReturn,
  }
}