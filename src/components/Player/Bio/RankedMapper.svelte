<script>
	import {navigate} from 'svelte-routing';
	import createClanStore from '../../../stores/http/http-clan-store';
	import createClanWithMapsStore from '../../../stores/http/http-clan-with-maps-store';
	import Spinner from '../../Common/Spinner.svelte';
	import ContentBox from '../../Common/ContentBox.svelte';
	import ClanInfo from '../../Clans/ClanInfo.svelte';
	import Rain from '../../Common/Rain.svelte';
	import RandomRain from '../../Common/RandomRain.svelte';
	import ClanInfoSmaller from '../../Clans/ClanInfoSmaller.svelte';
	import {fade} from 'svelte/transition';
	import {
		playersTitle,
		rankLabel,
		accLabel,
		ppLabel,
		capturesLabel,
		rankedPoolPercentLabel,
		rankValue,
		accValue,
		ppValue,
		capturesValue,
		rankedPoolPercentValue,
		ppIcon,
	} from '../../../utils/clans';
	import {BL_API_URL} from '../../../network/queues/beatleader/api-queue';

	export let mapperId;

	let rankedmaps = null;
	let topmap = null;

	function fetchRankedMapper(mapperId) {
		try {
			fetch(`${BL_API_URL}player/${mapperId}/rankedmaps`)
				.then(r => r.json())
				.then(response => {
					rankedmaps = response;
					topmap = rankedmaps.maps[0];
				});
		} catch {
			rankedmaps = null;
		}
	}

	$: fetchRankedMapper(mapperId);
</script>

{#if rankedmaps}
	<div class="leader-container">
		<img class="clanImage" src={topmap.cover} alt="Recent ranked map cover" />

		<div class="map-info-container">
			<span class="maps-title">Ranked mapper</span>
			<span class="map-name">{topmap.name}</span>
			<section class="title is-7">
				{rankedmaps.playersCount.toLocaleString('en-US', {maximumFractionDigits: 0})} players grinded {rankedmaps.totalPp.toLocaleString(
					'en-US',
					{maximumFractionDigits: 0}
				)}pp
			</section>
		</div>
		{#if rankedmaps.maps.length > 1}
			<div class="other-maps">
				<div class="other-maps-covers">
					{#each rankedmaps.maps.slice(1) as map}
						<img class="other-maps-cover" src={map.cover} alt="Other ranked maps covers" />
					{/each}
				</div>
				<span>and {rankedmaps.totalMapCount - 1} more...</span>
			</div>
		{/if}
	</div>
{/if}

<style>
	.align-content {
		display: flex;
		align-items: flex-start !important;
		justify-content: center !important;
	}

	.page-content {
		max-width: 65em;
		width: 100%;
	}

	article {
		width: calc(100% - 25em);
		overflow-x: hidden;
	}

	.ranking-grid-row {
		display: grid;
		grid-template-columns: auto 2.4em;
		grid-gap: 0.4em;
		align-items: center;
		justify-items: center;
	}

	.players {
		margin-top: 1rem;
		grid-gap: 0.5em;
	}

	.players:not(.with-icons) .ranking-grid-row {
		grid-template-columns: 1fr;
	}

	.players :global(> *:last-child) {
		border-bottom: none !important;
	}

	.switchers {
		display: flex;
		gap: 1em;
		justify-content: center;
	}

	:global(.primary-clan-button) {
		width: auto !important;
		margin-top: 0.3em !important;
	}

	aside {
		width: 35em;
	}

	aside .filter {
		margin-bottom: 1.5rem;
		transition: opacity 300ms;
	}

	aside .filter.disabled {
		opacity: 0.25;
	}

	aside label {
		display: block;
		font-weight: 500;
		margin-bottom: 1rem;
	}

	aside .filter.disabled label {
		cursor: help;
	}

	aside label span {
		color: var(--beatleader-primary);
	}

	aside input {
		width: 100%;
		font-size: 1em;
		color: var(--beatleader-primary);
		background-color: var(--foreground);
		border: none;
		border-bottom: 1px solid var(--faded);
		outline: none;
	}

	aside :global(.switch-types) {
		justify-content: flex-start;
	}

	.clan-info {
		width: 100%;
		border-radius: 15%;
	}

	.clan-info.rainbow:hover {
		color: #00ffbc;
		-webkit-background-clip: text;
		background-image: -webkit-linear-gradient(180deg, #f35626, #feab3a);
		-webkit-animation: rainbow 0.9s infinite linear;
		animation: rainbow 0.9s infinite linear;
	}

	.clanData {
		display: flex;
		gap: 0.8rem;
	}

	.clanData .form {
		flex-grow: 1;
		padding: 0.8rem;
	}

	.clanData .form > section:not(:last-child) {
		margin-bottom: 0.5rem;
	}

	.imageInput {
		cursor: pointer;
		display: flex;
		align-items: center;
		position: relative;
	}

	.leader-container {
		display: flex;
		padding: 0.5em;
		background-color: #3f0078;
		border-radius: 20px;
	}

	.clanImage {
		width: 5em;
		height: 5em;
		border-radius: 20%;
	}

	.map-info-container {
		display: flex;
		flex-direction: column;
		margin-left: 0.5em;
	}

	.map-name {
		font-size: 1.4em;
	}

	.maps-title {
		font-size: small;
		font-weight: 600;
		text-decoration-line: underline;
	}

	.other-maps {
		display: flex;
		flex-direction: column;
		justify-content: center;
		margin-left: 1em;
		margin-right: -0.5em;
		mask-image: linear-gradient(91deg, white, white 40%, transparent);
	}

	.other-maps-covers {
		display: flex;
		gap: 0.2em;
	}

	.other-maps-cover {
		width: 2em;
		border-radius: 25%;
	}

	.clanTag {
		color: var(--clan-color, 'red');
	}

	.clan-stats :global(> *) {
		margin-bottom: 0 !important;
	}

	.info {
		max-width: 92%;
		overflow: hidden;
		word-break: break-word;
	}

	.up-to-tablet {
		display: none;
	}

	.desktop {
		display: block;
	}

	@media screen and (max-width: 500px) {
		.clanData {
			flex-direction: column;
			align-items: center;
			gap: 0;
		}

		.clan-stats {
			display: flex;
			flex-direction: column;
		}

		.imageInput {
			margin: 0.7em;
		}

		.up-to-tablet {
			display: block;
		}

		.desktop {
			display: none;
		}
	}
	@media (hover: none) {
		.clan-info.rainbow {
			color: #00ffbc;
			-webkit-background-clip: text;
			background-image: -webkit-linear-gradient(180deg, #f35626, #feab3a);
			-webkit-animation: rainbow 0.9s infinite linear;
			animation: rainbow 0.9s infinite linear;
		}
	}

	@media screen and (max-width: 1275px) {
		.align-content {
			flex-direction: column;
			align-items: center;
		}

		aside {
			width: 100%;
			max-width: 65em;
		}
	}
</style>
