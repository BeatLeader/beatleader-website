import {writable} from 'svelte/store';

export default (key, prefix = 'bl-') => {
	const lsKey = `${prefix}-${key}`;

	const initial = JSON.parse(localStorage.getItem(lsKey)) ?? {};

	const {subscribe, unsubscribe, set: storeSet} = writable(initial);

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
