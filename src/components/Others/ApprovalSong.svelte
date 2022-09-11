<script>
	import {navigate} from 'svelte-routing';
	import Button from '../Common/Button.svelte';
	import Difficulty from '../Song/Difficulty.svelte';
	import {slide} from 'svelte/transition';
	import Spinner from '../Common/Spinner.svelte';
	import Dialog from '../Common/Dialog.svelte';
	import {BL_API_URL} from '../../network/queues/beatleader/api-queue';

	export let song;
	export let idx;

	let loading = false;
	let status;
	let popupShown, popupVisible;
	let ppStatus;

	function setStatus(newStatus) {
		status = newStatus ?? 0;
	}

	function retreivePPStatus(id) {
		fetch(BL_API_URL + 'map/totalpp?songId=' + id, {
			credentials: 'include',
		})
			.then(response => response.json())
			.then(data => {
				ppStatus = data;
			});
	}

	function updateStatus(newStatus) {
		if (newStatus == 1 && !popupShown && !popupVisible) {
			if (!ppStatus) {
				retreivePPStatus(song.id);
			}
			popupVisible = true;
		} else {
			if (newStatus == 1) {
				popupShown = true;
			}
			loading = true;

			fetch(BL_API_URL + 'maps/approve?songId=' + song.id + '&approval=' + newStatus, {
				credentials: 'include',
				method: 'POST',
			}).then(response => {
				if (response.status == 200) {
					loading = false;
					status = newStatus;
				}
			});
		}
	}

	$: setStatus(song.difficulties[0].mapperApproval);
	$: difficulties = song.difficulties;
</script>

{#if popupVisible}
	<Dialog
		type="confirm"
		title="Are you sure you want to unrank your map?"
		okButton="Yes, go ahead"
		okButtonType="danger"
		cancelButton="Cancel"
		on:confirm={() => {
			updateStatus(1);
			popupVisible = false;
		}}
		on:cancel={() => {
			popupVisible = false;
		}}>
		<div slot="content">
			{#if ppStatus}
				<span style="color: red">{ppStatus.playerCount} people will lose {Math.round(ppStatus.totalPP)}pp in total!</span>
			{/if}
		</div>
	</Dialog>
{/if}

<div class="container row-${idx}" transition:slide>
	{#if song}
		<img class="cover" src={song.coverImage} alt="" />
		<div style="display: grid; padding-left: 1em">
			<span>{song.name}</span>
			<div class="author">{song.mapper}</div>
			<div style="display: inline;">
				{#each difficulties as leaderboard, songId}
					<Difficulty
						diff={{type: leaderboard.modeName, diff: leaderboard.difficultyName, stars: leaderboard.stars}}
						pointer={true}
						useShortName={true}
						reverseColors={true}
						stars={leaderboard.stars}
						starsSuffix="★"
						showDiffIcons={false}
						enabled={true}
						on:click={() => navigate('leaderboard/global/' + song.id + leaderboard.value + leaderboard.mode)} />
				{/each}
			</div>
			{#if loading}
				<Spinner />
			{:else}
				<div class="buttons">
					<Button label="Unknown" type={status == 0 ? 'gray' : 'default'} on:click={() => updateStatus(0)} />
					<Button label="Unrank" type={status == 1 ? 'danger' : 'default'} on:click={() => updateStatus(1)} />
					<Button label="Keep ranked" type={status == 2 ? 'green' : 'default'} on:click={() => updateStatus(2)} />
				</div>
			{/if}
		</div>
	{:else}
		<div class="cover">
			<Spinner />
		</div>
	{/if}
</div>

<style>
	.container {
		display: flex;
		margin: 1.5em;
		border-radius: 1em;
		padding: 0.8em;
		background-color: rgba(87, 87, 87, 0.582);
	}

	.cover {
		width: 6em;
		height: 6em;
		border-radius: 0.5em;
	}

	:global(.delistSong) {
		position: absolute !important;
		right: 0.8em;
		border-radius: 0.5em !important;
	}

	.buttons {
		margin-top: 1em;
		grid-gap: 1em;
	}
</style>
