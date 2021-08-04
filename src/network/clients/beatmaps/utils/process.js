import {opt} from '../../../../utils/js'

export default response => {
  const hash = opt(response, 'versions.0.hash');
  const key = opt(response, 'versions.0.key');

  if (!hash || !key || !hash.toLowerCase) return null;

  return {...response, hash: hash.toLowerCase(), key}
}