import {default as createQueue, PRIORITY} from '../http-queue';
import {substituteVars} from "../../utils/format";
import makePendingPromisePool from '../../utils/pending-promises'

const BEATSAVER_API_URL = 'https://beatsaver.com/api';
const SONG_BY_HASH_URL = BEATSAVER_API_URL + '/maps/by-hash/${hash}';
const SONG_BY_KEY_URL = BEATSAVER_API_URL + '/maps/detail/${key}'

const resolvePromiseOrWaitForPending = makePendingPromisePool();

export default (options = {}) => {
  const queue = createQueue(options);

  const {fetchJson, fetchHtml, ...queueToReturn} = queue;

  const fetchSong = async (url, signal = null, priority = PRIORITY.FG_LOW, cacheTtl = null) => resolvePromiseOrWaitForPending(url, () => fetchJson(url, {signal, cacheTtl}, priority));

  const byHash = async (hash, signal = null, priority = PRIORITY.FG_LOW, cacheTtl = null) => fetchSong(substituteVars(SONG_BY_HASH_URL, {hash}), signal, priority, cacheTtl).then(r => r.body)
  const byKey = async (key, signal = null, priority = PRIORITY.FG_LOW, cacheTtl = null) => fetchSong(substituteVars(SONG_BY_KEY_URL, {key}), signal, priority, cacheTtl).then(r => r.body)

  return {
    byHash,
    byKey,
    ...queueToReturn,
  }
}