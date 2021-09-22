import {default as createQueue, PRIORITY} from '../http-queue';
import {substituteVars} from "../../../utils/format";

const ACCSABER_API_URL = 'https://api.accsaber.com';
const CATEGORIES_URL = ACCSABER_API_URL + '/categories';
const RANKING_URL = ACCSABER_API_URL + '/categories/${category}/standings';

export default (options = {}) => {
  const queue = createQueue(options);

  const {fetchJson, fetchHtml, ...queueToReturn} = queue;

  const categories = async (priority = PRIORITY.FG_LOW, options = {}) => fetchJson(CATEGORIES_URL, options, priority)
  const ranking = async (category = 'overall', priority = PRIORITY.FG_LOW, options = {}) => fetchJson(substituteVars(RANKING_URL, {category}), options, priority)

  return {
    categories,
    ranking,
    ...queueToReturn,
  }
}