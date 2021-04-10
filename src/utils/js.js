export const capitalize = (str) => str.charAt(0).toUpperCase() + str.slice(1);
export const isEmpty = (obj) => !obj || (obj.constructor === Object && Object.keys(obj).length === 0);
export const convertArrayToObjectByKey = (arr, key, asArray = false) =>
  arr.reduce((cum, item) => {
    if (asArray && !cum[item[key]]) cum[item[key]] = [];

    if (asArray) cum[item[key]].push(item);
    else cum[item[key]] = item;
    return cum;
  }, {});
export const arrayDifference = (arr1, arr2) => arr1.filter(x => !arr2.includes(x));
export const arrayIntersection = (arr1, arr2) => arr1.filter(x => arr2.includes(x));
export const arrayUnique = arr => [...new Set(arr)];
export const nullIfUndefined = (val) => (typeof val !== 'undefined' ? val : null);
export const defaultIfFalsy = (val, def) => (val ? val : def);
export const getFirstRegexpMatch = (regexp, str) => {
  let _ = regexp.exec(str);
  return _ ? _[1] : null;
};
export const escapeHtml = unsafe => unsafe
  .replace(/&/g, "&amp;")
  .replace(/</g, "&lt;")
  .replace(/>/g, "&gt;")
  .replace(/"/g, "&quot;")
  .replace(/'/g, "&#039;");
export const isDateObject = date => date && Object.prototype.toString.call(date) === "[object Date]" && !isNaN(date);
export const isPromise = p => p && Object.prototype.toString.call(p) === "[object Promise]";
export const isString = str => Object.prototype.toString.call(str) === "[object String]";