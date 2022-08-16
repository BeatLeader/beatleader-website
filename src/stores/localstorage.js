import {writable} from 'svelte/store';

export default (key, initial = {}, prefix = 'bl-') => {
	const lsKey = `${prefix}-${key}`;

	const value = JSON.parse(localStorage.getItem(lsKey)) ?? initial;

	const {subscribe, unsubscribe, set: storeSet} = writable(value ?? initial);

	const set = value => {
		localStorage.setItem(lsKey, JSON.stringify(value));

		storeSet(value);
	};

	return {
		subscribe,
		unsubscribe,
		set,
	};
};
