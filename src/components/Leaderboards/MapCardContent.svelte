<script>
	import {navigate} from 'svelte-routing';
	import {fade, fly} from 'svelte/transition';
	import Icons from '../Song/Icons.svelte';
	import {processScore} from '../../network/clients/beatleader/scores/utils/processScore';
	import QualificationStatusSmall from '../Leaderboard/QualificationStatusSmall.svelte';
	import {DifficultyStatus} from '../../utils/beatleader/format';
	import ReweightStatusSmall from '../Leaderboard/ReweightStatusSmall.svelte';
	import MapTimesetDescription from './MapTimesetDescription.svelte';
	import MapTriangleSmall from '../Leaderboard/MapTriangleSmall.svelte';
	import {formatNumber} from '../../utils/format';
	import SongScoreCompact from './SongScoreCompact.svelte';

	let backgroundColor = 'rgba(87, 82, 81, 0.7)';

	function retrieveBackgroundColor(img) {
		var context = document.createElement('canvas').getContext('2d');
		if (typeof img == 'string') {
			var src = img;
			img = new Image();
			img.setAttribute('crossOrigin', '');
			img.src = src;
		}
		img.onload = () => {
			context.imageSmoothingEnabled = true;
			context.drawImage(img, 0, 0, 1, 1);
			const imageData = context.getImageData(0, 0, 1, 1).data.slice(0, 3);

			backgroundColor = `rgba(${imageData[0] * 0.5},${imageData[1] * 0.5},${imageData[2] * 0.5},0.7)`;
		};
	}

	export let map;
	export let starsKey;
	export let currentFilters;
	export let idx;

	$: map?.song?.coverImage && retrieveBackgroundColor(map?.song?.coverImage);
</script>

<div
	class={`map-card row-${idx}`}
	in:fly={{delay: 250 + idx * 50, duration: 400, y: 100}}
	out:fade={{delay: 0, duration: 150}}
	style="background-image:  url({map?.song?.coverImage});">
	<a
		class="map-link"
		href="/leaderboard/global/${map.id}/1"
		on:keypress|preventDefault
		on:click|preventDefault={() => navigate(`/leaderboard/global/${map.id}/1`)} />
	<div class="map-card-header">
		<div class="difficulty">
			<MapTimesetDescription
				{map}
				stars={(map?.difficulty && map?.difficulty[starsKey]) ?? (map?.difficultyBl && map?.difficultyBl[starsKey])} />
		</div>

		{#if map?.difficulty?.accRating || map?.difficultyBl?.accRating}
			<div class="type" data-atropos-offset="6">
				<MapTriangleSmall leaderboard={map?.difficulty?.accRating ? map?.difficulty : map?.difficultyBl} />
			</div>
		{/if}
	</div>

	<div class="song-info">
		<div class="song-title" style="background-color: {backgroundColor};">
			<div class="name-and-author">
				<span class="name" data-atropos-offset="3">{map?.song?.name}</span>
				<span class="author" data-atropos-offset="2">{map?.song?.author}</span>
			</div>
			<div class="mapper" data-atropos-offset="2">Mapper: {map?.song?.mapper}</div>
		</div>
		<div class="other-details">
			<div class="details-and-icons">
				{#if map?.plays}
					<div class="map-details">
						{map?.plays} plays.
					</div>
				{:else if Number.isFinite(map?.positiveVotes) && Number.isFinite(map?.negativeVotes)}
					<div class="map-details">
						<span title={`${map.positiveVotes} rankable / ${map.negativeVotes} unrankable`}>
							{#if currentFilters.sortBy === 'voting'}
								Rating: {map.positiveVotes - map.negativeVotes}
							{:else if currentFilters.sortBy === 'voteratio'}
								Ratio:
								{formatNumber((map.positiveVotes / (map.positiveVotes + map.negativeVotes)) * 100)}%
							{:else}
								{map.positiveVotes + map.negativeVotes} vote{map.positiveVotes + map.negativeVotes > 1 ? 's' : ''}
							{/if}
						</span>
					</div>
				{/if}

				{#if map?.song?.hash?.length}
					<Icons hash={map.song.hash} diffInfo={map?.diffInfo} />
				{/if}
			</div>

			{#if map?.difficulty?.status == DifficultyStatus.nominated || map?.difficulty?.status == DifficultyStatus.qualified}
				<div class="status">
					<QualificationStatusSmall qualification={map.qualification} />
				</div>
			{:else if map?.reweight && !map.reweight.finished}
				<div class="status">
					<ReweightStatusSmall {map} />
				</div>
			{/if}

			{#if map?.myScore}
				<SongScoreCompact
					playerId={map.myScore.playerId}
					songScore={processScore({leaderboard: map, ...map.myScore})}
					service={'beatleader'} />
			{/if}
		</div>
	</div>
</div>

<style>
	.map-card {
		display: flex;
		flex-direction: column;
		justify-content: space-between;
		width: 18em;
		min-height: 20em;
		background-size: cover;
		background-position: 50%;
		border-radius: 0.4em;
		pointer-events: none;
		box-shadow: rgba(0, 0, 0, 0.24) 0px 3px 8px;
	}

	.map-link {
		position: fixed;
		width: 100%;
		height: 100%;
		pointer-events: all;
	}

	.map-card-header {
		display: flex;
		justify-content: space-between;
		align-items: start;
	}

	.song-info {
		display: flex;
		flex-direction: column;
	}

	.name-and-author {
		display: flex;
		flex-wrap: wrap;
		align-items: baseline;
		column-gap: 0.5em;
	}

	.author {
		font-size: small;
	}

	.type {
		margin: 0.5em;
	}

	.song-title {
		height: 6em;
		padding: 0.5em;
		display: flex;
		flex-direction: column;
		justify-content: space-between;
	}

	.other-details {
		min-height: 4em;
		background-color: #0a0a0a;
		flex-grow: 1;
		border-radius: 0 0 0.3em 0.3em;
	}

	.map-details {
		pointer-events: all;
	}

	.details-and-icons {
		display: flex;
		padding: 0.3em;
		justify-content: space-between;
	}

	.name {
		font-size: larger;
		font-weight: bold;
		white-space: nowrap;
		overflow: hidden;
		text-overflow: ellipsis;
	}

	.status {
		padding-left: 0.3em;
	}
</style>
