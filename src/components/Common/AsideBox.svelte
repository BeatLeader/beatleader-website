<script>
	import {slide, crossfade} from 'svelte/transition';
	import {cubicOut} from 'svelte/easing';
	import ContentBox from './ContentBox.svelte';
	import {configStore} from '../../stores/config';
	import {produce} from 'immer';

	export let title = 'box';
	export let faicon = '';
	export let boolname = null;
	export let contentClass = '';
	export let cls = '';

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

	$: opened = $configStore.preferences[boolname];
</script>

<ContentBox cls="aside-content-box frosted {cls}">
	<div class="box-toggle-section">
		<span
			class="reveal-button clickable"
			style="height: 1.5em;"
			on:click={() => boolflip(boolname)}
			title="{opened ? 'Hide' : 'Show'} {title}"
			in:receive={{key: 'button'}}
			out:send={{key: 'button'}}>
			<div class="left">
				<div class="icon-container">
					<i class={faicon} />
				</div>
				<span>{title}</span>
			</div>

			<i class="fas fa-chevron-{opened ? 'up' : 'down'}" />
		</span>
	</div>

	{#if opened}
		<div class="aside-box" transition:slide={{duration: 500, easing: cubicOut}}>
			<div class="darkened-background frosted">
				<slot class={contentClass}></slot>
			</div>
		</div>
	{/if}
</ContentBox>

<style>
	:global(.aside-content-box) {
		position: static !important;
		border-radius: 12px !important;
		margin-top: 0.36em !important;
	}

	.box-toggle-section {
		display: grid;
		grid-template-areas: 'button'; /* Single grid area */
		justify-items: stretch;
		min-width: max-content;
		gap: 0.25em;
		padding: 0 0.25em;
	}

	.reveal-button {
		grid-area: button; /* Assign to the same grid area */
		align-self: end;
		cursor: pointer;
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: 0.5em;
	}

	.reveal-button .left {
		display: flex;
		align-items: center;
		gap: 0.5em;
	}

	.aside-box {
		display: grid;
		align-items: center;
		gap: 0.25em;
		width: 100%;
		min-width: clamp(0px, 26em, 90vw);
	}

	.darkened-background {
		padding: 0.7em;
		border-radius: 0.5em;
	}

	.icon-container {
		display: flex;
		align-items: center;
		justify-content: center;
		width: 1.2em;
		height: 1.2em;
	}

	:global(aside .aside-content-box) {
		margin-inline: 0 !important;
		padding: 0.5rem !important;
	}
</style>
