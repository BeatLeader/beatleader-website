<script>
	import {tick, onMount} from 'svelte';
	import createAccountStore from '../stores/beatleader/account';
	import {configStore} from '../stores/config';

	import {BL_API_URL, CURRENT_URL} from '../network/queues/beatleader/api-queue';
	import BeastiesFinalistsDialog from './BeastiesFinalistsDialog.svelte';
	import {produce} from 'immer';

	const account = createAccountStore();

	export let openModal;
	export let closeModal;

	let isLoading = false;
	let allMaps = null;

	function showBeastiesFinalistsDialog(allMaps) {
		openModal(BeastiesFinalistsDialog, {
			allMaps,
			confirm: () => {
				closeModal();
				$configStore = produce($configStore, draft => {
					draft.preferences.beastiesFinalistsPopupShown = true;
				});
			},
			cancel: () => {
				closeModal();
				$configStore = produce($configStore, draft => {
					draft.preferences.beastiesFinalistsPopupShown = true;
				});
			},
		});
	}

	function fetchNominations() {
		isLoading = true;

		fetch(`${BL_API_URL}beasties/nominations/my/finalists`, {
			credentials: 'include',
		})
			.then(response => {
				if (response.status === 200) {
					return response.json();
				} else if (response.status === 404) {
					isLoading = false;
					return [];
				} else {
					console.error('Error fetching nominations:', response.status);
					return null;
				}
			})
			.then(songs => {
				allMaps = songs?.map((song, index) => {
					song.index = index;

					song.nominations = song.difficulties.reduce((nominations, diff) => {
						nominations.push(...(diff.nominations ?? []));
						return nominations;
					}, []);

					song.nominations.sort((a, b) => b.timepost - a.timepost);
					song.nominations = song.nominations.filter((nom, idx, arr) => arr.findIndex(n => n.category === nom.category) === idx);

					return song;
				});
				if (allMaps?.length > 0) {
					showBeastiesFinalistsDialog(allMaps);
				}
				isLoading = false;
			})
			.catch(error => {
				console.error('Error fetching nominations:', error);
				isLoading = false;
			});
	}

	$: if ($account.id && !allMaps && !$configStore.preferences.beastiesFinalistsPopupShown) {
		fetchNominations();
	}
</script>
