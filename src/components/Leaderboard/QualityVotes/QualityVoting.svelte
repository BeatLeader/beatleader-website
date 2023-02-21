<script>
	import {BL_API_URL} from '../../../network/queues/beatleader/api-queue';
	import Button from '../../Common/Button.svelte';
	import Popover from '../../Common/Popover.svelte';
	import QualityVote from './QualityVote.svelte';
	import {fade} from 'svelte/transition';
	import ContentBox from '../../Common/ContentBox.svelte';
	import Spinner from '../../Common/Spinner.svelte';
	import VoteWarning from './VoteWarning.svelte';
	import {getContext} from 'svelte';
	const {open, close} = getContext('simple-modal');

	export let qualification;
	export let currentPlayerId;
	export let isNQT;

	const QualityVoteValue = {
		positive: 1,
		neutral: 2,
		negative: 3,
	};

	let positiveVotes;
	let neutralVotes;
	let negativeVotes;

	let currentVote;

	function fetchVotes(votes) {
		var positiveArray = [];
		var neutralArray = [];
		var negativeArray = [];

		currentVote = null;

		votes?.forEach(element => {
			switch (element.value) {
				case QualityVoteValue.positive:
					positiveArray.push(element);
					break;
				case QualityVoteValue.neutral:
					neutralArray.push(element);
					break;
				case QualityVoteValue.negative:
					negativeArray.push(element);
					break;

				default:
					break;
			}

			if (element.playerId == currentPlayerId) {
				currentVote = element;
			}
		});

		positiveVotes = positiveArray;
		neutralVotes = neutralArray;
		negativeVotes = negativeArray;
	}

	let loading;
	let shouldShowConfirmation = true;
	async function postVote(value) {
		if (value == QualityVoteValue.negative && currentVote?.value != value && negativeVotes.length == 2 && shouldShowConfirmation) {
			open(VoteWarning, {
				confirm: () => {
					shouldShowConfirmation = false;
					close();
					postVote(value);
				},
				cancel: () => {
					close();
				},
			});

			return;
		}

		loading = true;
		fetch(BL_API_URL + `qualification/vote/${qualification.id}?vote=${value}`, {
			method: 'POST',
			credentials: 'include',
			headers: {'Content-Type': 'application/json'},
		})
			.then(r => r.json())
			.then(newvotes => {
				loading = false;
				shouldShowConfirmation = true;
				fetchVotes(newvotes, currentPlayerId);
			});
	}

	let positiveCounter;
	let neutralCounter;
	let negativeCounter;

	$: fetchVotes(qualification?.votes, currentPlayerId);
</script>

{#if isNQT}
	<div class="triple-container">
		{#if !loading}
			<Button
				type={currentVote?.value == QualityVoteValue.positive ? 'green' : 'default'}
				iconFa="fas fa-thumbs-up"
				on:click={() => postVote(QualityVoteValue.positive)} />
			<Button
				type={currentVote?.value == QualityVoteValue.neutral ? 'primary' : 'default'}
				iconFa="ok-icon"
				on:click={() => postVote(QualityVoteValue.neutral)} />
			<Button
				type={currentVote?.value == QualityVoteValue.negative ? 'danger' : 'default'}
				iconFa="fas fa-thumbs-down"
				on:click={() => postVote(QualityVoteValue.negative)} />
		{:else}
			<Spinner />
			<Spinner />
			<Spinner />
		{/if}
	</div>
{/if}

{#if positiveVotes?.length}
	<Popover triggerEvents={['hover', 'focus']} referenceElement={positiveCounter} placement="top" spaceAway={10}>
		<ContentBox>
			<div class="popover-contents" transition:fade={{duration: 250}}>
				{#each positiveVotes as vote}
					<QualityVote {vote} />
				{/each}
			</div>
		</ContentBox>
	</Popover>
{/if}

{#if neutralVotes?.length}
	<Popover triggerEvents={['hover', 'focus']} referenceElement={neutralCounter} placement="top" spaceAway={10}>
		<ContentBox>
			<div class="popover-contents" transition:fade={{duration: 250}}>
				{#each neutralVotes as vote}
					<QualityVote {vote} />
				{/each}
			</div>
		</ContentBox>
	</Popover>
{/if}

{#if negativeVotes?.length}
	<Popover triggerEvents={['hover', 'focus']} referenceElement={negativeCounter} placement="top" spaceAway={10}>
		<ContentBox>
			<div class="popover-contents" transition:fade={{duration: 250}}>
				{#each negativeVotes as vote}
					<QualityVote {vote} />
				{/each}
			</div>
		</ContentBox>
	</Popover>
{/if}

<div class="triple-container">
	<span bind:this={positiveCounter} style="color: green"><i class="fas fa-thumbs-up" /> {positiveVotes?.length}</span>
	<span bind:this={neutralCounter} style="color: white; margin-right: 1em; margin-left: 1em;">{neutralVotes?.length}</span>
	<span bind:this={negativeCounter} style="color: red"><i class="fas fa-thumbs-down" /> {negativeVotes?.length}</span>
</div>

<style>
	.triple-container {
		display: flex;
		justify-content: space-evenly;
	}
</style>
