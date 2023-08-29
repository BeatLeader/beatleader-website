import {writable} from 'svelte/store';

export default (key, initial = {}, prefix = 'bl-') => {
	const lsKey = `${prefix}-${key}`;

	let value = JSON.parse(localStorage.getItem(lsKey)) ?? initial;

	const {subscribe, unsubscribe, set: storeSet} = writable(value ?? initial);

	const set = newValue => {
		localStorage.setItem(lsKey, JSON.stringify(newValue));

		value = newValue;

		storeSet(newValue);
	};

	const update = fn => set(fn(value));

	return {
		subscribe,
		unsubscribe,
		set,
		update,
	};
};
