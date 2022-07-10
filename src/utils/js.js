export const capitalize = str => str?.length ? str.charAt(0).toUpperCase() + str.slice(1) : str;
export const decapitalize = str => str?.length ? str.charAt(0).toLowerCase() + str.slice(1) : str;
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

export const opt = (obj, key, defaultValue = undefined) => key.split('.').reduce((o, i) => o && o[i] !== null && o[i] !== undefined ? o[i] : defaultValue, obj);
export const optSet = (obj, key, value, createKeys = true) => {
  const keys = key.split('.');
  const last = keys.pop();
  if (!last) return false;

  const startObj = obj || {};

  let current = startObj;
  for(const i of keys) {
    const propertyExists = current.hasOwnProperty(i);
    if (!propertyExists && !createKeys) return obj;

    if (!propertyExists || current[i] === null || current[i] === undefined) current[i] = {};

    current = current[i];
  }

  current[last] = value;

  return startObj;
}

// TODO: replace with structuredClone when it's mature enough
// https://caniuse.com/?search=structuredclone
export const deepClone = val => JSON.parse(JSON.stringify(val))