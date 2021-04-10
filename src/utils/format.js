export const substituteVars = (url, vars) => Object.keys(vars).reduce((cum, key) => cum.replace(new RegExp('\\${' + key + '}', 'gi'), vars[key]), url);

export function formatNumber(num, digits = 2, addSign = false) {
  return (
    (addSign && num > 0 ? '+' : '') +
    num.toLocaleString('pl-PL', {
      minimumFractionDigits: digits,
      maximumFractionDigits: digits
    })
  );
}