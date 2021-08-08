import {opt} from '../../../../utils/js'

export default response => {
  const hash = opt(response, 'versions.0.hash');
  const key = opt(response, 'id');

  if (!hash || !key || !hash.toLowerCase) return null;

  return {...response, hash: hash.toLowerCase(), key}
}