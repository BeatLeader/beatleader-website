import {default as createQueue, PRIORITY} from '../http-queue';
import {substituteVars} from "../../../utils/format";

const ACCSABER_API_URL = 'https://api.accsaber.com';
const CATEGORIES_URL = ACCSABER_API_URL + '/categories';
const RANKING_URL = ACCSABER_API_URL + '/categories/${category}/standings';
const PLAYER_SCORES_URL = ACCSABER_API_URL + '/players/${playerId}/scores'

export default (options = {}) => {
  const queue = createQueue(options);

  const {fetchJson, fetchHtml, ...queueToReturn} = queue;

  const categories = async (priority = PRIORITY.FG_LOW, options = {}) => fetchJson(CATEGORIES_URL, options, priority)
  const ranking = async (category = 'overall', page = 1, priority = PRIORITY.FG_LOW, options = {}) => fetchJson(substituteVars(RANKING_URL, {category, page}), options, priority)
  const scores = async (playerId, page = 1, priority = PRIORITY.FG_LOW, options = {}) => fetchJson(substituteVars(PLAYER_SCORES_URL, {playerId, page}), options, priority)

  return {
    categories,
    ranking,
    scores,
    ...queueToReturn,
  }
}