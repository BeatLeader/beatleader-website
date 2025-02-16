<script>
	import {slide, crossfade} from 'svelte/transition';
	import ContentBox from '../Common/ContentBox.svelte';
	import {configStore} from '../../stores/config';
	import {produce} from 'immer';

	export let opened = false;
	export let title = 'box';
	export let faicon = '';
	export let boolname = null;
	export let contentClass = '';

	const [send, receive] = crossfade({
		duration: 300,
		fallback(node, params) {
			return slide(node, {duration: 300});
		},
	});

	function boolflip(name) {
		if (name == null) {
			console.log('boolname is null! cannot change aside button state!');
			return;
		}
		$configStore = produce($configStore, draft => {
			draft.preferences[name] = !draft.preferences[name];
		});
	}
</script>

<ContentBox cls="leaderboard-aside-box frosted">
	<div class="box-toggle-section">
		{#if !opened}
			<span
				class="reveal-button clickable"
				style="height: 1.5em;"
				on:click={() => boolflip(boolname)}
				title="Show {title}"
				in:receive={{key: 'button'}}
				out:send={{key: 'button'}}>
				<i class={faicon} />
				<i class="fas fa-chevron-right" />
			</span>
		{:else}
			<span
				class="reveal-button clickable"
				on:click={() => boolflip(boolname)}
				title="Hide {title}"
				in:receive={{key: 'button'}}
				out:send={{key: 'button'}}>
				<i class="fas fa-chevron-left" />
				<i class={faicon} />
				<span>{title}</span>
			</span>
		{/if}
	</div>

	{#if opened}
		<div class="aside-box" transition:slide>
			<div class="darkened-background frosted">
				<slot class={contentClass}></slot>
			</div>
		</div>
	{/if}
</ContentBox>

<style>
	:global(.leaderboard-aside-box) {
		position: static !important;
		border-radius: 12px !important;
		margin-top: 0.36em !important;
	}

	.box-toggle-section {
		display: grid;
		grid-template-areas: 'button'; /* Single grid area */
		justify-items: center;
		min-width: max-content;
		gap: 0.25em;
	}

	.reveal-button {
		grid-area: button; /* Assign to the same grid area */
		align-self: end;
		cursor: pointer;
		display: flex;
		align-items: center;
		gap: 0.5em;
	}

	.aside-box {
		display: grid;
		align-items: center;
		gap: 0.25em;
		margin-top: 0.25em;
	}

	.darkened-background {
		padding: 0.7em;
		border-radius: 0.5em;
	}
</style>
