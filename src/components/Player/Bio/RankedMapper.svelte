<script>
	import {createEventDispatcher} from 'svelte';

	export let mapperId;
	export let rankedmaps = null;
	export let topmap = null;
	export let editModel;

	const dispatch = createEventDispatcher();
	const availableSortings = [
		{
			id: 'recent',
			label: 'Recent',
			title: 'Sort by the rank date',
		},
		{
			id: 'top-stars',
			label: 'Stars',
			title: 'Sort by the top stars',
		},
		{
			id: 'top-grinded',
			label: 'Grinded',
			title: 'Sort by the amount of PP grinded',
		},
		{
			id: 'top-played',
			label: 'Played',
			title: 'Sort by playcount',
		},
	];
</script>

{#if rankedmaps}
	<div class="edit-container" class:editModel>
		{#if editModel}
			<div class="select-sort">
				<span>Sort maps by:</span>
				<select
					class="group-select"
					value={editModel.data?.rankedMapperSort ?? 'recent'}
					on:change={e => {
						editModel.data.rankedMapperSort = e.target.value;
						dispatch('sort-changed', e.target.value);
					}}>
					{#each availableSortings as option (option.id)}
						<option class="group-option" value={option.id} title={option.title}>
							{option.label}
						</option>
					{/each}
				</select>
			</div>
		{/if}
		<a href="/leaderboards?mappers={mapperId}" class="leader-container">
			<img class="clanImage" src={topmap.cover} alt="Recent ranked map cover" />

			<div class="map-info-container">
				<span class="maps-title">Ranked mapper</span>

				<span class="map-name">{topmap.name}</span>
				<section class="title is-7">
					{rankedmaps.totalPp.toLocaleString('en-US', {maximumFractionDigits: 0})}pp for {rankedmaps.playersCount.toLocaleString('en-US', {
						maximumFractionDigits: 0,
					})} players in total
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
		</a>
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

	.edit-container {
		display: contents;
	}

	.edit-container.editModel {
		display: flex;
		flex-direction: column;
	}

	.select-sort {
		display: flex;
		gap: 0.5em;
	}

	.group-select {
		height: fit-content;
		padding: 0.175rem;
		text-align: center;
		white-space: nowrap;
		border: 0;
		border-radius: 0.2em;
		cursor: pointer;
		color: #363636;
		background-color: #dbdbdb;
		box-shadow: none;
		opacity: 0.35;
		font-family: inherit;
		font-size: 0.875rem;
		font-weight: 500;
	}

	.group-option {
		color: black;
		font-family: inherit;
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
		background-color: #3f0078b8;
		border-radius: 20px;
		color: white !important;
		flex: 1;
		max-width: 28em;
		min-width: 20em;
	}

	.clanImage {
		width: 5em;
		height: 5em;
		border-radius: 20%;
	}

	.map-info-container {
		display: flex;
		flex-direction: column;
		justify-content: space-between;
		margin-left: 0.5em;
	}

	.map-name {
		font-size: 1.4em;
	}

	.maps-title {
		font-size: small;
		font-weight: 700;
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
