<script>
	import {configStore} from '../../stores/config';
	import {fly, fade} from 'svelte/transition';
	import RankingTable from '../Ranking/RankingTable.svelte';
	import Switch from '../Common/Switch.svelte';
	import {deepClone} from '../../utils/js';

	export let animationSign = 1;

	let rankingListKeys = [];
	let currentSettings = {};
	let labelMap = {
		showFriendsButton: 'Add to friends button',
		showClans: 'Clans',
		showDifference: 'Rank Difference',
		showCountryRank: 'Show Country',
		showColorsForCountryRank: 'Podium rank colors',
		showCountryDifference: 'Show Country Difference',
		openPlayerPopover: 'Open player popover',
	};

	function onConfigUpdated(config) {
		if (config?.rankingList) {
			rankingListKeys = Object.keys(config.rankingList);
			rankingListKeys.forEach(key => {
				currentSettings[key] = config.rankingList[key] ?? true;
			});
		}
	}

	async function settempsetting(key, value) {
		var rankingList = deepClone(configStore.get('rankingList'));
		rankingList[key] = value;
		await configStore.setForKey('rankingList', rankingList, false);
	}

	$: onConfigUpdated(configStore && $configStore ? $configStore : null);

	$: {
		Object.entries(currentSettings).forEach(([key, value]) => {
			settempsetting(key, value);
		});
	}
</script>

<div class="main-container" in:fly|global={{y: animationSign * 200, duration: 400}} out:fade|global={{duration: 100}}>
	<div class="profile">
		<RankingTable page={1} meta={false} editing={true} />
	</div>

	<section class="option">
		<label title="Determines when to show the buttons">Options</label>
		<div class="switches">
			{#each rankingListKeys as key}
				{#if labelMap[key]}
					<Switch
						value={currentSettings[key]}
						label={labelMap[key] || key}
						fontSize={12}
						design="slider"
						on:click={() => (currentSettings[key] = !currentSettings[key])} />
				{/if}
			{/each}
		</div>
	</section>
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
	.switches {
		display: flex;
		grid-gap: 1em;
		flex-wrap: wrap;
		justify-content: space-evenly;
		padding: 0.5em;
	}

	@media screen and (max-width: 600px) {
		.options {
			grid-template-columns: 1fr;
		}
		.switches {
			display: grid;
		}
	}
</style>
