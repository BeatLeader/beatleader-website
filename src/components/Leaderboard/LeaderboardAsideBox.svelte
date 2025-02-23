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
				<div class="left">
					<div class="icon-container">
						<i class={faicon} />
					</div>
					<span>{title}</span>
				</div>

				<i class="fas fa-chevron-down" />
			</span>
		{:else}
			<span
				class="reveal-button clickable"
				on:click={() => boolflip(boolname)}
				title="Hide {title}"
				in:receive={{key: 'button'}}
				out:send={{key: 'button'}}>
				<div class="left">
					<div class="icon-container">
						<i class={faicon} />
					</div>
					<span>{title}</span>
				</div>

				<i class="fas fa-chevron-up" />
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
		margin-top: 0.25em;
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
</style>
