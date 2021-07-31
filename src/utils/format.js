import {getCurrentLocale} from '../stores/config'

export const substituteVars = (url, vars) => Object.keys(vars).reduce((cum, key) => cum.replace(new RegExp('\\${' + key + '}', 'gi'), vars[key]), url);

export function formatNumber(num, digits = 2, addSign = false, notANumber = null) {
  if (!Number.isFinite(num)) {
    return notANumber;
  }

  return (
    (addSign && num > 0 ? '+' : '') +
    num.toLocaleString(getCurrentLocale(), {
      minimumFractionDigits: digits,
      maximumFractionDigits: digits
    })
  );
}

export const padNumber = (num, pad = 2) => (Array(pad).fill('0').join('') + num).slice(-pad);