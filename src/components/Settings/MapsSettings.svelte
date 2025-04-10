<script>
	import {configStore} from '../../stores/config';
	import Select from './Select.svelte';
	import RangeSlider from 'svelte-range-slider-pips';
	import Profile from '../Player/Profile.svelte';
	import Switch from '../Common/Switch.svelte';
	import processPlayerData from '../Player/utils/profile';
	import createStatsHistoryStore from '../../stores/beatleader/stats-history';
	import createPlayerInfoWithScoresStore from '../../stores/http/http-player-with-scores-store';
	import createPinnedScoresStore from '../../stores/beatleader/pinned-scores';
	import createAccountStore from '../../stores/beatleader/account';
	import {fly, fade} from 'svelte/transition';
	import CardsCarousel from '../Player/CardsCarousel.svelte';
	import {describeGraphAxis, describeMapsOption, describeMapCardsOption} from '../../utils/beatleader/format';
	import PinnedScores from '../Player/PinnedScores.svelte';
	import {debounce} from '../../utils/debounce';
	import {BL_API_URL} from '../../network/queues/beatleader/api-queue';
	import {deepClone} from '../../utils/js';
	import MapCard from '../Maps/List/MapCard.svelte';

	export let animationSign = 1;

	async function settempsetting(key, value) {
		var preferences = deepClone(configStore.get('preferences'));
		preferences[key] = value;
		await configStore.setForKey('preferences', preferences, false);
	}

	async function setroottempsetting(key, subkey, value) {
		if (subkey) {
			var preferences = deepClone(configStore.get(key));
			preferences[subkey] = value;
			await configStore.setForKey(key, preferences, false);
		} else {
			await configStore.setForKey(key, value, false);
		}
	}

	var maps = [];

	function fetchMaps() {
		for (let i = 0; i < 10; i++) {
			maps.push({
				index: maps.length,
				name: 'Loading...',
				artist: 'Unknown Artist',
				hash: '00000000000000000000000000000000',
				cover: 'https://via.placeholder.com/150',
				placeholder: true,
			});
		}

		fetch(`${BL_API_URL}maps?count=10&type=ranked&sortBy=timestamp&order=desc&mytype=played&difficulty=fullspread`, {
			credentials: 'include',
		})
			.then(res => res.json())
			.then(response => {
				let newMaps = response.data;

				if (!newMaps) return;
				for (let i = 0; i < newMaps.length; i++) {
					newMaps[i].index = i;
				}

				for (let i = 0; i < maps.length; i++) {
					const element = maps[i];
					const fetchedMap = newMaps.find(m => m.index == element.index);
					if (fetchedMap) {
						if (maps[i].placeholder && maps[i].updateCallback) {
							maps[i].updateCallback(fetchedMap);
						}
						maps[i] = fetchedMap;
					}
				}
			});
	}

	const account = createAccountStore();
	const statsHistoryStore = createStatsHistoryStore();
	const pinnedScoresStore = createPinnedScoresStore();

	$: mapsOptions = Object.keys($configStore.mapsOptions);
	$: mapCardsOptions = Object.keys($configStore.mapCards);
	$: fetchMaps();
</script>

<div
	class="main-container"
	in:fly|global={{y: animationSign * 200, duration: 400, delay: 0}}
	out:fade|global={{duration: 100}}
	on:outroend={() => {
		const el = document.querySelector('.main-container');
		if (el) el.remove();
	}}>
	<div class="profile">
		<div class="map-list">
			{#each maps as map}
				<MapCard {map} />
			{/each}
		</div>
	</div>

	<div class="options">
		<section class="option full" id="maps-options">
			<label title="Options for how maps are displayed throughout the website">Maps options:</label>
			<div class="switches">
				{#each mapsOptions as key}
					<Switch
						value={$configStore.mapsOptions[key]}
						label={describeMapsOption(key)}
						fontSize={12}
						design="slider"
						on:click={() => setroottempsetting('mapsOptions', key, !$configStore.mapsOptions[key])} />
				{/each}
			</div>
		</section>
	</div>

	<div class="options">
		<section class="option full" id="maps-options">
			<label title="Options for how cards on the maps list page are displayed">Cards options:</label>
			<div class="switches">
				{#each mapCardsOptions as key}
					<Switch
						value={$configStore.mapCards[key]}
						label={describeMapCardsOption(key)}
						fontSize={12}
						design="slider"
						on:click={() => setroottempsetting('mapCards', key, !$configStore.mapCards[key])} />
				{/each}
			</div>
		</section>
	</div>
</div>

<style>
	.main-container {
		display: flex;
		flex-direction: column;
	}

	.map-list {
		display: flex;
		gap: 1em;
		flex-wrap: wrap;
		justify-content: center;
	}

	.profile {
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

	.options {
		display: grid;
		grid-template-columns: repeat(2, 1fr);
		grid-gap: 1em;
		align-items: start;
		justify-items: start;
		margin-top: 1rem;
	}
	* :global(.option) {
		display: flex;
		flex-direction: column;
		width: 100%;
	}
	* :global(.option.full) {
		grid-column: span 2;
	}
	* :global(label) {
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
	.followers-switches {
		display: flex;
		grid-gap: 1em;
		flex-wrap: wrap;
		justify-content: space-evenly;
		padding: 0.5em;
	}
	.switches.start {
		justify-content: flex-start;
	}
	.single {
		width: calc(50% - 1rem);
	}

	@media screen and (max-width: 600px) {
		.switches {
			display: grid;
			grid-template-columns: repeat(2, 1fr);
		}

		.map-list {
			transform: scale(0.9);
			margin-left: -1em;
			margin-right: -1em;
			margin-top: -3em;
		}

		:global(.s--slider) {
			justify-content: space-between;
		}
	}
</style>
