export const capitalize = str => str.charAt(0).toUpperCase() + str.slice(1);
export const isEmpty = obj => !obj || (obj.constructor === Object && Object.keys(obj).length === 0);
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
export const nullIfUndefined = val => (typeof val !== 'undefined' ? val : null);
export const defaultIfFalsy = (val, def) => (val ? val : def);
export const getFirstRegexpMatch = (regexp, str) => {
	let _ = regexp.exec(str);
	return _ ? _[1] : null;
};
export const escapeHtml = unsafe =>
	unsafe.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#039;');
export const isDateObject = date => date && Object.prototype.toString.call(date) === '[object Date]' && !isNaN(date);
export const isPromise = p => p && Object.prototype.toString.call(p) === '[object Promise]';
export const isString = str => Object.prototype.toString.call(str) === '[object String]';

export const opt = (obj, key, defaultValue = undefined) =>
	key.split('.').reduce((o, i) => (o && o[i] !== null && o[i] !== undefined ? o[i] : defaultValue), obj);
export const optSet = (obj, key, value, createKeys = true) => {
	const keys = key.split('.');
	const last = keys.pop();
	if (!last) return false;

	const startObj = obj || {};

	let current = startObj;
	for (const i of keys) {
		const propertyExists = current.hasOwnProperty(i);
		if (!propertyExists && !createKeys) return obj;

		if (!propertyExists || current[i] === null || current[i] === undefined) current[i] = {};

		current = current[i];
	}

	current[last] = value;

	return startObj;
};

// TODO: replace with structuredClone when it's mature enough
// https://caniuse.com/?search=structuredclone
export const deepClone = val => JSON.parse(JSON.stringify(val));

export function shallowEqual(object1, object2, exceptionKeys = []) {
	if (!object1 && !object2) return true;
	if ((!object1 && object2) || (object1 && !object2)) return false;

	const keys1 = Object.keys(object1);
	const keys2 = Object.keys(object2);
	if (keys1.length !== keys2.length) {
		return false;
	}
	for (let key of keys1) {
		if (!exceptionKeys.includes(key) && object1[key] !== object2[key]) {
			return false;
		}
	}
	return true;
}

export function decapitalizeFirstLetter(string) {
	return string.charAt(0).toLowerCase() + string.slice(1);
}

export function isSelectionInsideElement(element, selection) {
	const sel = window.getSelection?.();
	if (sel && !sel.isCollapsed) {
		try {
			const range = sel.getRangeAt(0);
			if (element.contains(range.commonAncestorContainer)) return true;
		} catch (_) {}
	}
	return false;
}
