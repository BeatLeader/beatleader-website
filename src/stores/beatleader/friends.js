import { derived } from 'svelte/store'
import createAccountStore from './account'

const accountStore = createAccountStore();
const friendsStore = derived(accountStore, $account => $account?.friends ?? [])

export default friendsStore;
