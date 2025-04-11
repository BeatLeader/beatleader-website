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
	import {
		describeGraphAxis,
		describeMapsOption,
		describeMapCardsOption,
		starsToBackgroundColor,
		starsToColor,
	} from '../../utils/beatleader/format';
	import PinnedScores from '../Player/PinnedScores.svelte';
	import {debounce} from '../../utils/debounce';
	import {BL_API_URL} from '../../network/queues/beatleader/api-queue';
	import {deepClone} from '../../utils/js';
	import MapCard from '../Maps/List/MapCard.svelte';
	import {SORT_BY_VALUES, STAR_COLOR_OPTIONS} from '../Maps/List/constants';
	import deepEqual from 'deep-equal';
	import StarColorRange from './StarColorRange.svelte';
	import ColorPicker from '../Common/ColorPicker.svelte';

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

	const mapsSortOptions = [{value: 'last', name: 'Last selected', title: 'Sort by the last sort', icon: 'fa-sort'}, ...SORT_BY_VALUES];

	function onSortChange(event) {
		if (!event?.detail?.value || event.detail.value == $configStore.mapsListOptions.defaultSortBy) return null;

		setroottempsetting('mapsListOptions', 'defaultSortBy', event.detail.value);
	}

	function parseRGBA(rgba) {
		let hex = rgba.replace('rgba(', '').replace(')', '');
		let components = hex.split(',');

		const r = parseInt(components[0]);
		const g = parseInt(components[1]);
		const b = parseInt(components[2]);
		const a = parseFloat(components[3]);

		return {r, g, b, a};
	}

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

	{#if $configStore.mapsOptions.starDiffColors}
		<section class="option full" id="star-color-options">
			<label title="Options for star-based difficulty colors">Star color options:</label>
			<StarColorRange height="3em" />
			<div class="options">
				<div class="option">
					<label>Pivot (0-1)</label>
					<input
						type="range"
						min="0"
						max="1"
						step="0.01"
						value={$configStore.starColorOptions.pivot}
						on:input={e => setroottempsetting('starColorOptions', 'pivot', parseFloat(e.target.value))} />
					<span>{$configStore.starColorOptions.pivot}</span>
				</div>
				<div class="option">
					<label>White text threshold</label>
					<input
						type="range"
						min="0"
						max="15"
						step="0.5"
						value={$configStore.starColorOptions.whiteTreshold}
						on:input={e => setroottempsetting('starColorOptions', 'whiteTreshold', parseFloat(e.target.value))} />
					<span>{$configStore.starColorOptions.whiteTreshold}</span>
				</div>
				<div class="option">
					<label>Darken threshold</label>
					<input
						type="range"
						min="0"
						max="15"
						step="0.5"
						value={$configStore.starColorOptions.darkenTreshold}
						on:input={e => setroottempsetting('starColorOptions', 'darkenTreshold', parseFloat(e.target.value))} />
					<span>{$configStore.starColorOptions.darkenTreshold}</span>
				</div>
				<div class="option">
					<label>Component 1 (0-1)</label>
					<input
						type="range"
						min="0"
						max="1"
						step="0.01"
						value={$configStore.starColorOptions.component2}
						disabled={$configStore.starColorOptions.range == 'custom'}
						on:input={e => setroottempsetting('starColorOptions', 'component2', parseFloat(e.target.value))} />
					<span>{$configStore.starColorOptions.component2}</span>
				</div>
				<div class="option">
					<label>Component 2 (0-1)</label>
					<input
						type="range"
						min="0"
						max="1"
						step="0.01"
						value={$configStore.starColorOptions.component3}
						disabled={$configStore.starColorOptions.range == 'custom'}
						on:input={e => setroottempsetting('starColorOptions', 'component3', parseFloat(e.target.value))} />
					<span>{$configStore.starColorOptions.component3}</span>
				</div>
				<div class="option">
					<label>Color space</label>
					<Select
						value={$configStore.starColorOptions.range}
						on:change={e => setroottempsetting('starColorOptions', 'range', e.detail.value)}
						options={[
							{value: 'hsv', name: 'HSV'},
							{value: 'invertedhsv', name: 'Inverted HSV'},
							{value: 'hsl', name: 'HSL'},
							{value: 'custom', name: 'Custom Gradient'},
						]} />
				</div>
			</div>
			{#if $configStore.starColorOptions.range == 'custom'}
				<div class="color-options">
					<section class="option" id="custom-gradient-left-color">
						<label title="Select color for the left side of the spectrum">Left Color</label>
						<ColorPicker
							on:colorChange={e => setroottempsetting('starColorOptions', 'leftColor', parseRGBA(e.detail))}
							startColor={`rgba(${$configStore.starColorOptions.leftColor.r}, ${$configStore.starColorOptions.leftColor.g}, ${$configStore.starColorOptions.leftColor.b}, ${$configStore.starColorOptions.leftColor.a})`} />
					</section>

					<section class="option" id="custom-gradient-center-color">
						<label title="Select color for the center of the spectrum">Center Color</label>
						<ColorPicker
							on:colorChange={e => setroottempsetting('starColorOptions', 'centerColor', parseRGBA(e.detail))}
							startColor={`rgba(${$configStore.starColorOptions.centerColor.r}, ${$configStore.starColorOptions.centerColor.g}, ${$configStore.starColorOptions.centerColor.b}, ${$configStore.starColorOptions.centerColor.a})`} />
					</section>

					<section class="option" id="custom-gradient-right-color">
						<label title="Select color for the right side of the spectrum">Right Color</label>
						<ColorPicker
							on:colorChange={e => setroottempsetting('starColorOptions', 'rightColor', parseRGBA(e.detail))}
							startColor={`rgba(${$configStore.starColorOptions.rightColor.r}, ${$configStore.starColorOptions.rightColor.g}, ${$configStore.starColorOptions.rightColor.b}, ${$configStore.starColorOptions.rightColor.a})`} />
					</section>
				</div>
			{/if}

			{#if !deepEqual($configStore.starColorOptions, STAR_COLOR_OPTIONS)}
				<div class="button-container">
					<button
						on:click={() => {
							Object.entries(STAR_COLOR_OPTIONS).forEach(([key, value]) => {
								setroottempsetting('starColorOptions', key, value);
							});
						}}>Reset to default</button>
				</div>
			{/if}
		</section>
	{/if}

	<div class="options">
		<section class="option full" id="cards-options">
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

	<div class="options">
		<section class="option full" id="maps-list-options">
			<label title="Options for the maps list page">Sorting default</label>
			<Select value={$configStore.mapsListOptions.defaultSortBy} on:change={onSortChange} fontSize="0.8" options={mapsSortOptions} />
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

	.color-options {
		display: grid;
		grid-template-columns: repeat(3, 1fr);
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
