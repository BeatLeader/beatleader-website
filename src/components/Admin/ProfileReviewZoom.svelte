<script>
	import {createEventDispatcher} from 'svelte';
	import Modal from '../Common/Modal.svelte';
	import Switcher from '../Common/Switcher.svelte';

	export let title = '';
	export let images = [];
	export let selected = images[0]?.id;
	export let avatar = false;

	const dispatch = createEventDispatcher();

	function portal(node) {
		document.body.appendChild(node);
		return {destroy: () => node.remove()};
	}

	function step(delta) {
		const index = images.findIndex(i => i.id == current?.id);
		selected = images[(index + delta + images.length) % images.length]?.id;
	}

	function onKeyDown(e) {
		if (images.length < 2) return;
		if (e.key == 'ArrowLeft') step(-1);
		else if (e.key == 'ArrowRight') step(1);
	}

	$: current = images.find(i => i.id == selected) ?? images[0];
	$: switcherValues = images.map(i => ({id: i.id, label: i.label, iconFa: i.iconFa}));
	$: switcherValue = switcherValues.find(v => v.id == current?.id);
</script>

<svelte:window on:keydown={onKeyDown} />

<div use:portal>
	<Modal width="auto" on:close={() => dispatch('close')}>
		<div class="zoom">
			<div class="zoom-title">{title}</div>

			{#if switcherValues.length > 1}
				<Switcher values={switcherValues} value={switcherValue} on:change={e => (selected = e.detail.id)} />
			{/if}

			{#if current}
				<a class="zoom-image" class:avatar href={current.url} target="_blank" rel="noreferrer" title="Open the original in a new tab">
					<img src={current.url} alt={current.label} />
				</a>
				<div class="zoom-url">{current.url}</div>
			{/if}
		</div>
	</Modal>
</div>

<style>
	.zoom {
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: 0.6em;
	}

	.zoom-title {
		align-self: stretch;
		padding-right: 2em;
		font-weight: bold;
		word-break: break-word;
	}

	.zoom-image {
		display: flex;
		justify-content: center;
		cursor: zoom-in;
	}

	/* Small images are scaled up, that's the point of zooming in */
	.zoom-image img {
		min-height: min(24em, 50vh);
		max-width: min(56em, 85vw);
		max-height: 70vh;
		object-fit: contain;
		border-radius: 8px;
	}

	/* The square is kept so the corners are visible too */
	.zoom-image.avatar img {
		width: min(28em, 80vw);
		aspect-ratio: 1/1;
	}

	.zoom-url {
		max-width: min(56em, 85vw);
		color: var(--faded, #999);
		font-size: 0.8em;
		word-break: break-all;
		text-align: center;
	}
</style>
