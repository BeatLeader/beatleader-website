<script>
	import {fade, slide} from 'svelte/transition';
	import ContentBox from '../Common/ContentBox.svelte';
	import {configStore} from '../../stores/config';
	import {produce} from 'immer';

	export let opened = false;
	export let title = 'box';
	export let faicon = '';
	export let boolname = null;

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
	{#if !opened}
		<div class="box-toggle-section" transition:fade>
			<span class="reveal-button clickable" on:click={() => boolflip(boolname)} title="Show {title}">
				<i class={faicon} />

				<i class="fas fa-chevron-right" />
			</span>
		</div>
	{:else}
		<div class="aside-box" transition:slide>
			<div class="box-toggle-section">
				<span class="reveal-button clickable" on:click={() => boolflip(boolname)} title="Hide {title}">
					<i class="fas fa-chevron-left" />
					<i class={faicon} />
					<span>{title}</span>
				</span>
			</div>

			<div class="darkened-background frosted">
				<slot></slot>
			</div>
		</div>
	{/if}
</ContentBox>

<style>
	.box-toggle-section {
		display: grid;
		justify-items: center;
		min-width: max-content;
	}

	.aside-box {
		display: grid;
		align-items: center;
		gap: 0.25em;
	}

	.reveal-button {
		align-self: end;
		cursor: pointer;
		display: flex;
		align-items: center;
		gap: 0.5em;
	}

	.reveal-button > i {
		transition: transform 500ms;
		transform-origin: 0.42em 0.5em;
	}

	.reveal-button.opened > i {
		transform: rotateZ(180deg);
	}

	.darkened-background {
		padding: 0.7em;
		border-radius: 0.5em;
	}
</style>
