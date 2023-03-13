import {derived} from 'svelte/store';
import createAccountStore from './account';

const accountStore = createAccountStore();
const followedStore = derived(accountStore, $account => $account?.followed ?? []);

export default followedStore;
