import { opt } from '../../../../utils/js'

export default response => {
  const versions = opt(response, 'versions');
  if (!versions || !Array.isArray(versions) || !versions.length) return null;

  const lastIdx = versions.length - 1;

  const hash = opt(versions, `${lastIdx}.hash`);
  const key = opt(response, 'id');

  if (!hash || !key || !hash.toLowerCase) return null;

  return { ...response, hash: hash.toLowerCase(), key }
}