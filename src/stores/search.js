import {writable} from 'svelte/store';

export const search = writable(false);
export const searchValue = writable('');
