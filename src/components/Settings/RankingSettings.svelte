<script>
	import {configStore} from '../../stores/config';
	import {fly, fade} from 'svelte/transition';
	import RankingTable from '../Ranking/RankingTable.svelte';
	import Switch from '../Common/Switch.svelte';

	export let animationSign = 1;

	let currentShowFriendsButton = true;

	function onConfigUpdated(config) {
		if (config?.preferences?.showFriendsButtonOnRanking != currentShowFriendsButton)
			currentShowFriendsButton = config?.preferences?.showFriendsButtonOnRanking ?? true;
	}

	async function settempsetting(key, value) {
		var preferences = configStore.get('preferences');
		preferences[key] = value;
		await configStore.setForKey('preferences', preferences, false);
	}

	$: onConfigUpdated(configStore && $configStore ? $configStore : null);

	$: settempsetting('showFriendsButtonOnRanking', currentShowFriendsButton);
</script>

<div class="main-container" in:fly={{y: animationSign * 200, duration: 400}} out:fade={{duration: 100}}>
	<div class="profile">
		<RankingTable page={1} meta={false} editing={true} />
	</div>

	<div class="options">
		<section class="option">
			<label title="Determines when to show the buttons">Options</label>
			<Switch
				value={currentShowFriendsButton}
				label="Add to friends button"
				fontSize={12}
				design="slider"
				on:click={() => (currentShowFriendsButton = !currentShowFriendsButton)} />
		</section>
	</div>
</div>

<style>
	.main-container {
		display: flex;
		flex-direction: column;
	}

	.profile {
		max-width: 67em;
		overflow: auto;
		max-height: 22.3em;
		border: 3px dashed var(--textColor);
		padding-top: 0.3em;
		scrollbar-width: none;
	}

	.profile::-webkit-scrollbar {
		display: none;
	}

	.options {
		display: grid;
		grid-template-columns: repeat(2, 1fr);
		grid-gap: 1em;
		align-items: start;
		justify-items: start;
		margin-top: 1rem;
	}

	.option {
		display: flex;
		flex-direction: column;
		width: 100%;
	}

	label {
		display: block;
		font-size: 0.75em;
		letter-spacing: 0.1em;
		text-transform: uppercase;
		color: #afafaf !important;
		margin-bottom: 0.25em;
	}

	@media screen and (max-width: 600px) {
		.options {
			grid-template-columns: 1fr;
		}
	}
</style>
